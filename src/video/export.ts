"use client";

import type { PublicExperience } from "@/lib/orders/service";
import { clipNames, clipUrl, loadFonts, loadStills } from "./assets";
import { renderMusic } from "./music";
import { clipTime, drawFrame, type Img } from "./render";
import { buildTimeline, FPS, shotAt, VIDEO_H, VIDEO_W } from "./timeline";

export type ExportResult = { blob: Blob; ext: "mp4" | "webm"; mime: string };

/**
 * Renders the whole video in the browser, frame by frame, with the same drawing code
 * as the preview, and encodes it. H.264 + AAC in an MP4 plays everywhere (WhatsApp,
 * Instagram, every phone). Browsers that can't encode H.264 get a WebM instead.
 */
export async function exportVideo(experience: PublicExperience, opts: { onProgress?(p: number): void; signal?: AbortSignal; watermark?: string } = {}): Promise<ExportResult> {
  const mb = await import("mediabunny");
  const { config, values, photos, music } = experience;
  const video = config.video!;
  const timeline = buildTimeline(video, values, photos.length);
  const [stills] = await Promise.all([loadStills(video, photos), loadFonts(config.theme)]);

  const forceVp9 = (window as unknown as { __wtForceVp9Mp4?: boolean }).__wtForceVp9Mp4;
  const avc = !forceVp9 && (await mb.canEncodeVideo("avc", { width: VIDEO_W, height: VIDEO_H }));
  const mp4 = avc || !!forceVp9;
  const vCodec = avc ? "avc" : "vp9";
  const aCodec = mp4 ? "aac" : "opus";
  if (mp4 && !(await mb.canEncodeAudio("aac"))) (await import("@mediabunny/aac-encoder")).registerAacEncoder();

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_W;
  canvas.height = VIDEO_H;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  const output = new mb.Output({ format: mp4 ? new mb.Mp4OutputFormat({ fastStart: "in-memory" }) : new mb.WebMOutputFormat(), target: new mb.BufferTarget() });
  const vSource = new mb.CanvasSource(canvas, { codec: vCodec, bitrate: 2_500_000, keyFrameInterval: 2 });
  output.addVideoTrack(vSource, { frameRate: FPS });
  const soundtrack = music ? await renderMusic(music.source, timeline.duration).catch(() => null) : null;
  const aSource = soundtrack ? new mb.AudioBufferSource({ codec: aCodec, bitrate: 160_000 }) : null;
  if (aSource) output.addAudioTrack(aSource);
  await output.start();

  // Background clips are decoded at exactly the times each frame needs them.
  const readers = new Map<string, { sink: InstanceType<typeof mb.CanvasSink>; duration: number }>();
  for (const name of clipNames(video)) {
    try {
      const input = new mb.Input({ source: new mb.UrlSource(clipUrl(name)), formats: mb.ALL_FORMATS });
      const track = await input.getPrimaryVideoTrack();
      if (track && (await track.canDecode())) readers.set(name, { sink: new mb.CanvasSink(track, { width: VIDEO_W, height: VIDEO_H, fit: "cover", poolSize: 2 }), duration: await input.computeDuration() });
    } catch {
      /* a missing clip leaves the design's own background showing */
    }
  }

  try {
    if (aSource && soundtrack) await aSource.add(soundtrack);
    const frames = Math.ceil(timeline.duration * FPS);
    for (let i = 0; i < frames; i++) {
      if (opts.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const t = i / FPS;
      const shot = shotAt(timeline, t);
      let footage: Img | null = null;
      const r = shot?.scene.clip ? readers.get(shot.scene.clip) : undefined;
      if (shot && r) footage = (await r.sink.getCanvas(clipTime(shot, t, r.duration)))?.canvas ?? null;
      drawFrame(ctx, t, { config, values, timeline, assets: { ...stills, clip: () => footage }, watermark: opts.watermark });
      await vSource.add(t, 1 / FPS);
      if (i % 6 === 0) {
        opts.onProgress?.(i / frames);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await output.finalize();
  } catch (e) {
    await output.cancel().catch(() => {});
    throw e;
  }
  opts.onProgress?.(1);
  const buf = (output.target as InstanceType<typeof mb.BufferTarget>).buffer!;
  const mime = mp4 ? "video/mp4" : "video/webm";
  return { blob: new Blob([buf], { type: mime }), ext: mp4 ? "mp4" : "webm", mime };
}

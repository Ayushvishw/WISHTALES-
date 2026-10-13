"use client";

import { useEffect, useRef } from "react";
import { resolveValues } from "@/lib/personalization";
import { SAMPLE_PHOTOS, sampleFor } from "@/lib/sample";
import type { TemplateConfig } from "@/lib/templates/schema";
import { clipUrl, loadFonts, loadStills } from "./assets";
import { drawFrame, type Img } from "./render";
import { buildTimeline, VIDEO_H, VIDEO_W } from "./timeline";

/** One still from the real video, drawn by the video engine with sample details, for shop cards. */
export function VideoPoster({ t, className }: { t: TemplateConfig; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !t.video) return;
    let off = false;
    const draw = async () => {
      const values = resolveValues(t, sampleFor(t.occasion, t.slug));
      const photos = SAMPLE_PHOTOS.slice(0, 3);
      const timeline = buildTimeline(t.video!, values, photos.length);
      const shot = timeline.shots.find((s) => s.scene.kind === "names") ?? timeline.shots[0];
      const at = shot.start + Math.min(shot.dur - 0.7, 3.2);
      const [stills] = await Promise.all([loadStills(t.video!, photos), loadFonts(t.theme)]);
      let footage: Img | null = null;
      if (shot.scene.clip) footage = await clipFrame(clipUrl(shot.scene.clip), at - shot.start);
      if (off) return;
      drawFrame(el.getContext("2d", { alpha: false })!, at, { config: t, values, timeline, assets: { ...stills, clip: () => footage } });
    };
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        void draw();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { off = true; io.disconnect(); };
  }, [t]);
  return <canvas ref={ref} width={VIDEO_W} height={VIDEO_H} className={className} aria-hidden="true" style={{ background: t.video?.sky[1] }} />;
}

function clipFrame(url: string, at: number): Promise<Img | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const done = (ok: boolean) => resolve(ok && v.videoWidth ? v : null);
    v.onerror = () => done(false);
    v.onloadeddata = () => { v.currentTime = Math.min(at, (v.duration || 1) - 0.1); };
    v.onseeked = () => done(true);
    setTimeout(() => done(false), 8000);
    v.src = url;
  });
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicExperience } from "@/lib/orders/service";
import type { Protect } from "@/story/Story";
import { clipNames, LiveClips, loadFonts, loadStills } from "./assets";
import { renderMusic } from "./music";
import { drawFrame, type Assets } from "./render";
import { buildTimeline, shotAt, VIDEO_H, VIDEO_W } from "./timeline";
import "./video.css";

type Props = { experience: PublicExperience; ribbon?: string; protect?: Protect; onEvent?(name: "experience_completed"): void };

/**
 * Plays a video invitation live on a canvas, drawn by the same code that renders the
 * downloaded file. It starts muted and loops; tapping sound on plays the real soundtrack.
 */
export function VideoExperience({ experience, ribbon, protect, onEvent }: Props) {
  const { config, values, photos, music } = experience;
  const video = config.video!;
  const timeline = useMemo(() => buildTimeline(video, values, photos.length), [video, values, photos.length]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef({ t: 0, last: 0 });
  const [playing, setPlaying] = useState(true);
  const [sound, setSoundState] = useState(false);
  const soundOn = useRef(false);
  const setSound = (on: boolean) => { soundOn.current = on; setSoundState(on); };
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const stills = useRef<Pick<Assets, "photos" | "art">>({ photos: [], art: {} });
  const clips = useRef<LiveClips | null>(null);
  const audio = useRef<{ ctx: AudioContext; buf: AudioBuffer | null; node: AudioBufferSourceNode | null; key: string } | null>(null);
  const live = useRef({ timeline, values, playing, watermark: protect?.watermark });
  live.current = { timeline, values, playing, watermark: protect?.watermark };

  // Fonts, photos and paintings; clips stream in on their own.
  useEffect(() => {
    let off = false;
    void Promise.all([loadStills(video, photos), loadFonts(config.theme)]).then(([s]) => {
      if (off) return;
      stills.current = s;
      setReady(true);
    });
    return () => { off = true; };
  }, [video, photos, config.theme]);

  useEffect(() => {
    clips.current = new LiveClips(clipNames(video));
    return () => clips.current?.dispose();
  }, [video]);

  // The clock and the drawing loop.
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d", { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let done = false;
    const tick = (now: number) => {
      const c = clock.current;
      const { timeline: tl, playing: on } = live.current;
      if (on && c.last) c.t += Math.min(0.1, (now - c.last) / 1000);
      c.last = now;
      if (c.t >= tl.duration) {
        c.t = 0;
        if (!done) { done = true; onEvent?.("experience_completed"); }
        restartSound(0);
      }
      const shot = shotAt(tl, c.t);
      clips.current?.sync(shot?.scene.clip, shot ? Math.max(0, c.t - shot.start) : 0, on);
      drawFrame(ctx, c.t, {
        config, values: live.current.values, timeline: tl, watermark: live.current.watermark,
        assets: { ...stills.current, clip: (n) => clips.current?.frame(n) ?? null },
      });
      setProgress(c.t / tl.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, ready]);

  const stopSound = () => {
    try { audio.current?.node?.stop(); } catch { /* already stopped */ }
    if (audio.current) audio.current.node = null;
  };

  function restartSound(at: number) {
    const a = audio.current;
    if (!a?.buf || !soundOn.current) return;
    stopSound();
    const n = a.ctx.createBufferSource();
    n.buffer = a.buf;
    n.connect(a.ctx.destination);
    n.start(0, Math.min(at, a.buf.duration - 0.05));
    a.node = n;
  }

  const toggleSound = async () => {
    if (!music) return;
    if (sound) { stopSound(); setSound(false); return; }
    const key = `${music.source}|${timeline.duration}`;
    if (!audio.current) audio.current = { ctx: new AudioContext(), buf: null, node: null, key: "" };
    const a = audio.current;
    void a.ctx.resume();
    setSound(true);
    if (a.key !== key) {
      a.key = key;
      a.buf = await renderMusic(music.source, timeline.duration).catch(() => null);
    }
    if (a.buf && live.current.playing) {
      const n = a.ctx.createBufferSource();
      n.buffer = a.buf;
      n.connect(a.ctx.destination);
      n.start(0, clock.current.t);
      stopSound();
      a.node = n;
    }
  };

  useEffect(() => () => { stopSound(); void audio.current?.ctx.close(); }, []);

  const togglePlay = () => {
    const next = !playing;
    setPlaying(next);
    if (!next) stopSound();
    else if (sound) restartSound(clock.current.t);
  };

  const restart = () => {
    clock.current.t = 0;
    setPlaying(true);
    if (sound) restartSound(0);
  };

  const secs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <div className="vx">
      <canvas ref={canvas} width={VIDEO_W} height={VIDEO_H} className="vx-canvas" onClick={togglePlay} aria-label={`${config.name} video preview`} role="img" />
      {ribbon && <div className="vx-ribbon">{ribbon}</div>}
      <div className="vx-bar">
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>}
        </button>
        <div className="vx-track" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></div>
        <span className="vx-time">{secs(progress * timeline.duration)} / {secs(timeline.duration)}</span>
        <button type="button" onClick={restart} aria-label="Play from the start">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" fill="currentColor" /></svg>
        </button>
        {music && (
          <button type="button" onClick={toggleSound} aria-label={sound ? "Mute" : "Sound on"} className={sound ? "on" : ""}>
            {sound ? <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" fill="currentColor" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9zm12 0l-1.4 1.4L16.2 12l-1.6 1.6L16 15l1.6-1.6L19.2 15l1.4-1.4-1.6-1.6 1.6-1.6L19.2 9l-1.6 1.6z" fill="currentColor" /></svg>}
          </button>
        )}
      </div>
      {!sound && music && <button type="button" className="vx-sound-hint" onClick={toggleSound}>Tap for sound</button>}
      {protect?.locked && progress > 0.85 && <div className="vx-cta">{protect.locked}</div>}
    </div>
  );
}

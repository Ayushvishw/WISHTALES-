"use client";

import { useEffect, useRef, useState } from "react";
import { resolveValues } from "@/lib/personalization";
import { SAMPLE_PHOTOS, sampleFor } from "@/lib/sample";
import { CATALOG } from "@/lib/templates/catalog";
import { loadFonts, loadStills } from "@/video/assets";
import { drawFrame } from "@/video/render";
import { buildTimeline, VIDEO_H, VIDEO_W } from "@/video/timeline";

export function Frames() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = CATALOG.find((x) => x.slug === q.get("slug"));
    if (!t?.video) return;
    (async () => {
      const values = resolveValues(t, sampleFor(t.occasion, t.slug));
      const photos = SAMPLE_PHOTOS.slice(0, 4);
      const timeline = buildTimeline(t.video!, values, photos.length);
      const [stills] = await Promise.all([loadStills(t.video!, photos), loadFonts(t.theme)]);
      const el = ref.current!;
      const ctx = el.getContext("2d", { alpha: false })!;
      const draw = (at: number) => drawFrame(ctx, at, { config: t, values, timeline, assets: { ...stills, clip: () => null } });
      const w = window as unknown as { __draw: (at: number) => void; __ready: boolean; __timeline: unknown };
      w.__draw = draw;
      w.__timeline = timeline.shots.map((s) => ({ kind: s.scene.kind, item: s.item, start: s.start, dur: s.dur }));
      draw(Number(q.get("t") ?? 1));
      w.__ready = true;
      setInfo(`${timeline.duration}s`);
    })();
  }, []);
  return (
    <div style={{ background: "#333", padding: 8 }}>
      <canvas ref={ref} width={VIDEO_W} height={VIDEO_H} style={{ width: 360, height: 640 }} />
      <p id="info" style={{ color: "#fff" }}>{info}</p>
    </div>
  );
}

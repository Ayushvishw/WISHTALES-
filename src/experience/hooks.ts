"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(m.matches);
    const on = () => setReduce(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
}

/**
 * Press-and-hold interaction (mouse, touch or Space/Enter). Releasing early
 * resets progress. Works without hover, as required for phones.
 */
export function useHold(ms: number, onDone: () => void, onStart?: () => void) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const t0 = useRef(0);
  const done = useRef(false);
  const doneCb = useRef(onDone);
  doneCb.current = onDone;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = (now: number) => {
    const p = Math.min(1, (now - t0.current) / ms);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      doneCb.current();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };
  const start = () => {
    if (done.current) return;
    onStart?.();
    t0.current = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (done.current) return;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };
  const isKey = (e: KeyboardEvent) => e.key === " " || e.key === "Enter";

  return {
    progress,
    bind: {
      onPointerDown: (e: PointerEvent) => { e.preventDefault(); start(); },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onKeyDown: (e: KeyboardEvent) => { if (isKey(e) && !e.repeat) { e.preventDefault(); start(); } },
      onKeyUp: (e: KeyboardEvent) => { if (isKey(e)) stop(); },
      onBlur: stop,
      onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
    },
  };
}

/** Celebration particles drawn on a canvas, in the template's colors. */
export function burst(cv: HTMLCanvasElement | null, colors: string[]) {
  if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = cv.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  cv.width = r.width * dpr;
  cv.height = r.height * dpr;
  const x = cv.getContext("2d");
  if (!x) return;
  x.scale(dpr, dpr);
  const ps = Array.from({ length: 110 }, () => ({
    x: r.width / 2 + (Math.random() - 0.5) * 80, y: r.height * 0.5,
    vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 9 - 3,
    s: Math.random() * 3 + 1.5, c: colors[(Math.random() * colors.length) | 0], a: 1, f: Math.random() * 0.018 + 0.008,
  }));
  const t0 = performance.now();
  const frame = (now: number) => {
    x.clearRect(0, 0, r.width, r.height);
    for (const p of ps) {
      p.vy += 0.2; p.x += p.vx; p.y += p.vy; p.a -= p.f;
      if (p.a > 0) { x.globalAlpha = p.a; x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); }
    }
    if (now - t0 < 3000) requestAnimationFrame(frame);
    else x.clearRect(0, 0, r.width, r.height);
  };
  requestAnimationFrame(frame);
}

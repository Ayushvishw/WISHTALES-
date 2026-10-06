"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Experience } from "@/experience/Experience";
import type { PublicExperience } from "@/lib/orders/service";

export type LiveSlide = { slug: string; name: string; experience: PublicExperience };

/**
 * The home page banner: a phone running a real template, switching theme every
 * few seconds. Once someone taps inside it, it stops switching so they can play.
 */
export function HeroLive({ slides }: { slides: LiveSlide[] }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const [hover, setHover] = useState(false);
  const phone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (held || hover || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), 4200);
    return () => clearTimeout(t);
  }, [i, held, hover, slides.length]);
  const s = slides[i];
  if (!s) return null;
  const t = s.experience.config.theme;
  return (
    <div className="live" style={{ "--ta": t.accent, "--tb": t.accent2 } as React.CSSProperties}>
      <div className="live-halo" aria-hidden="true" />
      <div
        ref={phone}
        className="live-phone"
        onPointerDown={() => setHeld(true)}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(true); }}
        onPointerLeave={() => setHover(false)}
      >
        <div className="live-notch" aria-hidden="true" />
        <div className="live-screen" key={s.slug}>
          <Experience experience={s.experience} ribbon="Live" />
        </div>
      </div>
      <div className="live-meta">
        <span className="live-dot" aria-hidden="true" />
        <span>{held ? "You're playing " : "Now showing "}<b>{s.name}</b></span>
        {held ? (
          <button className="live-link" onClick={() => { setHeld(false); setI((n) => (n + 1) % slides.length); }}>Next theme</button>
        ) : (
          <Link className="live-link" href={`/sample/${s.slug}`}>Open full screen</Link>
        )}
      </div>
      <div className="live-dots" role="tablist" aria-label="Templates">
        {slides.map((x, k) => (
          <button key={x.slug} role="tab" aria-selected={k === i} aria-label={x.name} className={k === i ? "on" : ""} onClick={() => setI(k)}>
            {k === i && !held && !hover && <i key={i} />}
          </button>
        ))}
      </div>
    </div>
  );
}

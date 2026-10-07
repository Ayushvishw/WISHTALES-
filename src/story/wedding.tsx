"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Chapter } from "@/lib/templates/schema";
import { seeded } from "./art";
import { useInView } from "./love";
import type { StoryContext } from "./Story";
import "./wedding.css";

/* Wedding film chapters: a painted blessing, painted moments of the day, and the couple's photos as a film. */

type Of<T extends Chapter["type"]> = Extract<Chapter, { type: T }>;
type P<T extends Chapter["type"]> = { chapter: Of<T>; ctx: StoryContext; num: number | null };

const ART_ALT: Record<string, string> = {
  ganesha: "Lord Ganesha seated on a lotus, with lit diyas",
  entrance: "The bride and groom walking in together towards the mandap",
  varmala: "The bride placing the varmala around the groom",
  phere: "The bride and groom taking the pheras around the sacred fire",
};

const artSrc = (art: string) => `/art/wedding/${art}.webp`;

/** The painting fills a phone screen; on a wide screen it stands in the middle over a soft, blurred copy of itself. */
function Art({ art, lazy }: { art: string; lazy?: boolean }) {
  return (
    <div className="wf-art">
      <img className="wf-haze" src={artSrc(art)} alt="" aria-hidden="true" loading={lazy ? "lazy" : undefined} />
      <img className="wf-main" src={artSrc(art)} alt={ART_ALT[art]} loading={lazy ? "lazy" : undefined} />
    </div>
  );
}

/** Falling petals or rising sparks over a painting. */
function Drift({ kind, count, reduce }: { kind: "petals" | "sparks"; count: number; reduce: boolean }) {
  const bits = useMemo(() => {
    const r = seeded(kind === "petals" ? 11 : 23);
    return Array.from({ length: count }, (_, i) => ({ i, l: r() * 100, z: 7 + r() * 9, d: 7 + r() * 7, dl: -r() * 14, h: r() * 40 - 20 }));
  }, [kind, count]);
  if (reduce) return null;
  return (
    <div className={`wf-drift ${kind}`} aria-hidden="true">
      {bits.map((b) => (
        <span key={b.i} style={{ left: `${b.l}%`, width: b.z, height: b.z, animationDuration: `${b.d}s`, animationDelay: `${b.dl}s`, filter: `hue-rotate(${b.h}deg)` }} />
      ))}
    </div>
  );
}

/* ---------------- the blessing ---------------- */

function Blessing({ chapter, ctx }: P<"blessing">) {
  const box = useRef<HTMLElement>(null);
  const seen = useInView(box);
  return (
    <section ref={box} className={`st-sec wf-sec wf-bless${seen ? " on" : ""}`}>
      <Art art={chapter.art} />
      <div className="wf-shade" aria-hidden="true" />
      <div className="wf-diyas" aria-hidden="true"><i /><i /><i /><i /></div>
      <Drift kind="petals" count={14} reduce={ctx.reduce} />
      <div className="wf-top">
        <p className="wf-mantra">{ctx.fill(chapter.mantra)}</p>
      </div>
      <div className="wf-bottom">
        {chapter.verse && <p className="wf-verse">{ctx.fill(chapter.verse)}</p>}
        <p className="wf-line">{ctx.fill(chapter.line)}</p>
        <span className="wf-more" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ---------------- a painted moment ---------------- */

function Scene({ chapter, ctx }: P<"scene">) {
  const box = useRef<HTMLElement>(null);
  const seen = useInView(box);
  return (
    <section ref={box} className={`st-sec wf-sec wf-scene wf-${chapter.art}${seen ? " on" : ""}`}>
      <Art art={chapter.art} lazy />
      <div className="wf-shade" aria-hidden="true" />
      {chapter.art === "phere" && <div className="wf-fire" aria-hidden="true" />}
      <Drift kind={chapter.art === "phere" ? "sparks" : "petals"} count={chapter.art === "entrance" ? 18 : 10} reduce={ctx.reduce} />
      <span className="wf-bar top" aria-hidden="true" />
      <span className="wf-bar bottom" aria-hidden="true" />
      <div className="wf-caption">
        <p className="wf-eyebrow">{ctx.fill(chapter.eyebrow)}</p>
        <h2 className="wf-title">{ctx.fill(chapter.title)}</h2>
        {chapter.line && <p className="wf-line">{ctx.fill(chapter.line)}</p>}
      </div>
    </section>
  );
}

/* ---------------- the couple's film ---------------- */

const FRAME_MS = 4800;

function Film({ chapter, ctx }: P<"film">) {
  const box = useRef<HTMLElement>(null);
  const seen = useInView(box);
  const photos = ctx.photos;
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!seen || paused || ctx.reduce || photos.length < 2) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % photos.length), FRAME_MS);
    return () => clearTimeout(t);
  }, [seen, paused, at, photos.length, ctx.reduce]);
  if (!photos.length) return null;
  const caption = chapter.captions?.[at];
  return (
    <section ref={box} className={`st-sec wf-film-sec${seen ? " on" : ""}`}>
      <div className="st-wrap center">
        <p className="st-eyebrow">{ctx.fill(chapter.eyebrow)}</p>
        <h2 className="st-h2">{ctx.fill(chapter.title)}</h2>
        {chapter.lead && <p className="st-lead">{ctx.fill(chapter.lead)}</p>}
        <button
          type="button"
          className="wf-film"
          onClick={() => setAt((i) => (i + 1) % photos.length)}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          aria-label="Next photo"
        >
          {photos.map((src, i) => (
            <img key={i} src={src} alt={`Moment ${i + 1}`} className={`${i === at ? "now" : ""} k${i % 3}`} loading="lazy" />
          ))}
          <span className="wf-grain" aria-hidden="true" />
          <span className="wf-bar top" aria-hidden="true" />
          <span className="wf-bar bottom" aria-hidden="true" />
          {caption && <span key={at} className="wf-film-cap">{ctx.fill(caption)}</span>}
        </button>
        {photos.length > 1 && (
          <div className="wf-dots" role="tablist" aria-label="Photos">
            {photos.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === at} aria-label={`Photo ${i + 1}`} className={i === at ? "on" : ""} onClick={() => setAt(i)}>
                <i style={i === at && !paused && !ctx.reduce ? { animationDuration: `${FRAME_MS}ms` } : undefined} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export const WEDDING_CHAPTERS = {
  blessing: Blessing,
  scene: Scene,
  film: Film,
} as const;

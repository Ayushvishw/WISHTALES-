"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { fillText } from "@/lib/personalization";
import type { Scene } from "@/lib/templates/schema";
import { unlockAudio } from "./audio";
import type { SceneContext } from "./Experience";
import { useHold } from "./hooks";
import { PUZZLES } from "./puzzles";

type P<T extends Scene["type"]> = { scene: Extract<Scene, { type: T }>; ctx: SceneContext };

function Continue({ ctx, label = "Continue", ghost }: { ctx: SceneContext; label?: string; ghost?: boolean }) {
  return <button className={ghost ? "x-btn ghost" : "x-btn"} onClick={ctx.next}>{label}</button>;
}

/** Shows children after a delay, for pacing (instant with reduced motion). */
function After({ ms, reduce, children }: { ms: number; reduce: boolean; children: ReactNode }) {
  const [show, setShow] = useState(reduce);
  useEffect(() => {
    if (reduce) return setShow(true);
    const t = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(t);
  }, [ms, reduce]);
  return <div className="x-fade" data-show={show}>{children}</div>;
}

function Hold({ scene, ctx }: P<"hold">) {
  const [gone, setGone] = useState(false);
  const { progress, bind } = useHold(1300, () => {
    setGone(true);
    ctx.startMusic();
    setTimeout(ctx.next, ctx.reduce ? 50 : 750);
  }, unlockAudio);
  const glyph = {
    seal: <span className="x-obj obj-seal">{(ctx.values.sender_name || "W")[0].toUpperCase()}</span>,
    gift: <span className="x-obj obj-gift" />,
    star: <span className="x-obj obj-star">✦</span>,
  }[scene.variant];
  return (
    <>
      <div className="x-eyebrow">For {ctx.values.recipient_name}</div>
      <h1>{fillText(scene.title, ctx.values)}</h1>
      <button className={gone ? "x-hold gone" : "x-hold"} aria-label={scene.hint} {...bind}>
        <svg viewBox="0 0 170 170" aria-hidden="true">
          <circle className="bgc" cx="85" cy="85" r="80" />
          <circle cx="85" cy="85" r="80" strokeDasharray="503" strokeDashoffset={503 * (1 - progress)} />
        </svg>
        {glyph}
      </button>
      <div className="x-hint">{scene.hint}</div>
    </>
  );
}

function Greeting({ scene, ctx }: P<"greeting">) {
  const { values } = ctx;
  useEffect(() => {
    const t = setTimeout(ctx.celebrate, 250);
    return () => clearTimeout(t);
  }, [ctx]);
  const date = values.event_date
    ? new Date(values.event_date + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";
  const title = fillText(scene.title, values);
  const name = values.recipient_name;
  const at = name ? title.indexOf(name) : -1;
  const sub = scene.sub ? fillText(scene.sub, values) : "";
  return (
    <>
      {date && <div className="x-eyebrow">{date}</div>}
      {scene.showAge && values.age && <div className="x-age">{values.age}</div>}
      <h1>
        {at >= 0 ? (<>{title.slice(0, at)}<span className="x-name">{name}</span>{title.slice(at + name.length)}</>) : title}
      </h1>
      {sub && <p className="x-sub">{sub}</p>}
      <Continue ctx={ctx} />
    </>
  );
}

const TILT = [-3, 4, -6];

function Photos({ scene, ctx }: P<"photos">) {
  const [k, setK] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const { photos } = ctx;
  if (scene.layout === "film") {
    return (
      <>
        <h2>{fillText(scene.title, ctx.values)}</h2>
        <div className="x-film">
          {photos.map((src, i) => <img key={src} src={src} alt={`Photo ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} />)}
        </div>
        <div className="x-count">{photos.length} photos · swipe</div>
        <Continue ctx={ctx} />
      </>
    );
  }
  const last = k >= photos.length - 1;
  const advance = () => {
    if (last || leaving) return;
    setLeaving(true);
    setTimeout(() => { setK((v) => v + 1); setLeaving(false); }, ctx.reduce ? 0 : 350);
  };
  const visible = photos.slice(k, k + 3);
  return (
    <>
      <h2>{fillText(scene.title, ctx.values)}</h2>
      <button className="x-pstack" aria-label="Next photo" onClick={advance}>
        {visible.map((src, depth) => ({ src, depth })).reverse().map(({ src, depth }) => (
          <div
            key={src}
            className="x-polaroid"
            style={{
              transform: depth === 0 && leaving ? "translateX(120%) rotate(18deg)" : `rotate(${TILT[(k + depth) % 3]}deg) translateY(${depth * 6}px)`,
              opacity: depth === 0 && leaving ? 0 : 1,
              zIndex: 10 - depth,
            }}
          >
            {/* Next photos are preloaded just ahead of time, not all at once. */}
            <img src={src} alt={`Photo ${k + depth + 1}`} />
          </div>
        ))}
      </button>
      <div className="x-count">{k + 1} of {photos.length}{last ? "" : " · tap the photo"}</div>
      <Continue ctx={ctx} ghost={!last} />
    </>
  );
}

function Puzzle({ scene, ctx }: P<"puzzle">) {
  const [solved, setSolved] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [forced, setForced] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), scene.fallbackAfter * 1000);
    return () => clearTimeout(t);
  }, [scene.fallbackAfter]);
  const solvedRef = useRef(false);
  const win = () => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    setSolved(true);
    ctx.celebrate();
  };
  const Game = PUZZLES[scene.puzzle];
  const photos = scene.photos.map((i) => ctx.photos[i] ?? ctx.photos[0]);
  const reveal = scene.reveal ? fillText(scene.reveal, ctx.values) : "";
  return (
    <>
      <h2>{fillText(scene.title, ctx.values)}</h2>
      <div className="x-hint">{scene.hint}</div>
      <Game photos={photos} reveal={reveal} theme={ctx.theme} forced={forced} onSolved={win} />
      {solved && reveal && scene.puzzle !== "scratch" && <p className="x-sub">{reveal}</p>}
      {solved ? <Continue ctx={ctx} /> : showSkip && (
        <button className="x-skip" onClick={() => setForced(true)}>Show me</button>
      )}
    </>
  );
}

function Message({ ctx }: P<"message">) {
  const lines = (ctx.values.message || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const step = ctx.reduce ? 0 : 1.3;
  return (
    <>
      <div className="x-paper">
        {lines.map((l, k) => <p key={k} style={{ animationDelay: `${0.3 + k * step}s` }}>{l}</p>)}
        <p className="sig" style={{ animationDelay: `${0.3 + lines.length * step}s` }}>{ctx.values.sender_name}</p>
      </div>
      <After ms={(0.6 + lines.length * step) * 1000} reduce={ctx.reduce}><Continue ctx={ctx} /></After>
    </>
  );
}

function Ritual({ scene, ctx }: P<"ritual">) {
  const [out, setOut] = useState(false);
  const [after, setAfter] = useState(false);
  const { progress, bind } = useHold(1600, () => {
    setOut(true);
    setTimeout(() => { ctx.celebrate(); setAfter(true); }, ctx.reduce ? 0 : 900);
  });
  const candles = Math.max(3, Math.min(5, Math.round((Number(ctx.values.age) || 24) / 8)));
  const flame = ctx.reduce || out ? undefined : { transform: `scale(${1 - progress * 0.5}) rotate(${progress * 18}deg)` };
  return (
    <>
      <h2>{fillText(scene.title, ctx.values)}</h2>
      {scene.ritual === "candles" ? (
        <div className={out ? "x-cake out" : "x-cake"} aria-hidden="true">
          <div className="t t1" /><div className="t t2" />
          <div className="candles">
            {Array.from({ length: candles }, (_, i) => (
              <div className="candle" key={i}><div className="x-flame" style={progress > 0 ? flame : undefined} /><div className="x-smoke" /></div>
            ))}
          </div>
        </div>
      ) : (
        <div className={out ? "x-wishstar fly" : "x-wishstar"} aria-hidden="true">★</div>
      )}
      {!out && (
        <button className="x-holdbar" {...bind}>
          <i style={{ transform: `scaleX(${progress})` }} />
          <span>{scene.ritual === "candles" ? "Hold to blow out the candles" : "Hold to send your wish"}</span>
        </button>
      )}
      {after && (
        <>
          <p className="x-sub">Your wish stayed with you. Wish Tale never records it.</p>
          <Continue ctx={ctx} />
        </>
      )}
    </>
  );
}

function Closing({ ctx }: P<"closing">) {
  return (
    <>
      <div className="x-eyebrow">From {ctx.values.sender_name}</div>
      <p className="x-closing">{ctx.values.closing_line}</p>
      <button className="x-btn ghost" onClick={ctx.restart}>Replay from the start</button>
    </>
  );
}

export const SCENES = {
  hold: Hold,
  greeting: Greeting,
  photos: Photos,
  puzzle: Puzzle,
  message: Message,
  ritual: Ritual,
  closing: Closing,
} satisfies { [K in Scene["type"]]: (p: P<K>) => ReactNode };

"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import type { Chapter } from "@/lib/templates/schema";
import { Floater, isRomantic, Motif, seeded } from "./art";
import { Obj, skinObjects } from "./obj";
import { INVITE_CHAPTERS } from "./invite";
import { WEDDING_CHAPTERS } from "./wedding";
import { LoveLock, LOVE_CHAPTERS, RingBox } from "./love";
import type { StoryContext } from "./Story";

type Of<T extends Chapter["type"]> = Extract<Chapter, { type: T }>;
type P<T extends Chapter["type"]> = { chapter: Of<T>; ctx: StoryContext; num: number | null };

/** Customer lines for a list chapter (one per line), topped up from the template's defaults. */
export function listFrom(ctx: StoryContext, field: string | undefined, defaults: string[], count: number, max = 200) {
  const own = (field ? ctx.values[field] ?? "" : "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, max));
  const out = own.slice(0, count);
  for (const d of defaults) {
    if (out.length >= count) break;
    out.push(ctx.fill(d));
  }
  return out;
}

export function Head({ chapter, ctx, num, center }: { chapter: { eyebrow: string; title: string; lead?: string }; ctx: StoryContext; num: number | null; center?: boolean }) {
  return (
    <div className={center ? "st-head center" : "st-head"}>
      <Obj name={skinObjects(ctx.story.skin)[(num ?? 0) % 4]} size={64} className="st-head-obj" />
      <p className="st-eyebrow">{num ? `Chapter ${num} · ` : ""}{ctx.fill(chapter.eyebrow)}</p>
      <h2 className="st-h2">{ctx.fill(chapter.title)}</h2>
      {chapter.lead && <p className="st-lead">{ctx.fill(chapter.lead)}</p>}
    </div>
  );
}

export function Section({ children, className = "", center }: { children: ReactNode; className?: string; center?: boolean }) {
  return (
    <section className={`st-sec ${className}`}>
      <div className={center ? "st-wrap center" : "st-wrap"}>{children}</div>
    </section>
  );
}

/* ---------------- hero ---------------- */

type Burst = { id: number; x: number; y: number; c: string };

function Hero({ chapter, ctx }: P<"hero">) {
  const name = ctx.values.recipient_name || "";
  const age = ctx.values.age;
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const layer = useRef<HTMLDivElement>(null);
  const burstId = useRef(0);
  const wishIdx = useRef(0);
  const COUNT = 12;
  const floaters = useMemo(() => {
    const r = seeded(11 + round);
    return Array.from({ length: COUNT }, (_, i) => ({
      i, l: 4 + ((i * 83) % 88) + r() * 4, d: 13 + r() * 9, dl: -(r() * 16) - (i % 4) * 1.5, sw: 2.4 + r() * 2,
      w: 46 + r() * 26, c: ctx.palette[i % ctx.palette.length],
    }));
  }, [round, ctx.palette]);
  const words = name.split(/\s+/).filter(Boolean);

  const pop = (i: number, e: RPointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    const box = layer.current?.getBoundingClientRect();
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (box) {
      const id = burstId.current++;
      setBursts((s) => [...s, { id, x: b.left - box.left + b.width / 2, y: b.top - box.top + b.height / 3, c: floaters[i].c }]);
      setTimeout(() => setBursts((s) => s.filter((x) => x.id !== id)), 1100);
    }
    setPopped((s) => new Set(s).add(i));
    const w = chapter.wishes[wishIdx.current % chapter.wishes.length];
    wishIdx.current++;
    ctx.toast(ctx.fill(w));
  };
  const all = popped.size >= COUNT;
  const cue = useRef<HTMLButtonElement>(null);

  return (
    <section className="st-hero">
      <div className="st-breath" aria-hidden="true"><span className="r2" /><span className="r1" /><span className="r3" /></div>
      <div className="st-props" aria-hidden="true">
        {skinObjects(ctx.story.skin).map((o, i) => <Obj key={o} name={o} size={[110, 84, 92, 72][i]} className={`p${i}`} />)}
      </div>
      <div className="st-hero-copy">
        <p className="st-kicker">{ctx.fill(chapter.kicker)}</p>
        <h1 className={`st-name st-name-${chapter.nameStyle}`} aria-label={name}>
          {words.map((wd, wi) => (
            <span className="w" key={wi} aria-hidden="true">
              {[...wd].map((ch, k) => (
                <span className="l" key={k} style={{ animationDelay: `${(wi * 4 + k) * 0.09}s` }}>{ch}</span>
              ))}
            </span>
          ))}
        </h1>
        {chapter.showAge && age && <p className="st-age"><span>Turning</span><b>{age}</b></p>}
        <p className="st-lead center">{ctx.fill(chapter.lead)}</p>
        {chapter.floaters !== "none" && (
          <span className="st-chip">
            <Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={16} />
            Pop the {chapter.floaters} · {popped.size} of {COUNT} wishes found
          </span>
        )}
        {all && <button className="st-btn gold" onClick={() => { setPopped(new Set()); setRound((r) => r + 1); }}>Release more</button>}
      </div>
      {chapter.floaters !== "none" && (
        <div className="st-floaters" ref={layer}>
          {floaters.map((f) =>
            popped.has(f.i) ? null : (
              <div key={`${round}-${f.i}`} className="st-fwrap" style={{ left: `${f.l}%`, animationDuration: `${f.d}s`, animationDelay: `${f.dl}s` }}>
                <button className="st-floater" style={{ animationDuration: `${f.sw}s`, color: ctx.theme.fg }} onClick={(e) => pop(f.i, e)} aria-label={`Pop ${chapter.floaters.replace(/s$/, "")} ${f.i + 1}`}>
                  <Floater kind={chapter.floaters as "balloons"} color={f.c} w={f.w} />
                </button>
              </div>
            ),
          )}
          {bursts.map((b) => (
            <div key={b.id} className="st-burst" style={{ left: b.x, top: b.y }}>
              <span className="ring" style={{ borderColor: b.c }} />
              {Array.from({ length: 8 }, (_, k) => (
                <span key={k} className="pt" style={{ transform: `rotate(${k * 45}deg)` }}>
                  <Motif kind={ctx.story.motif} fill={ctx.palette[k % ctx.palette.length]} size={k % 2 ? 14 : 18} className={k % 2 ? "near" : "far"} />
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      <button className={`st-cue${ctx.swipe ? " st-cue-side" : ""}`} ref={cue} onClick={() => ctx.scrollToNext(cue.current)}>
        {ctx.swipe ? "Swipe for more surprises" : "More surprises below"}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ctx.swipe ? "M9 6l6 6-6 6" : "M6 9l6 6 6-6"} /></svg>
      </button>
    </section>
  );
}

/* ---------------- runaway question ---------------- */

function Question({ chapter, ctx, num }: P<"question">) {
  const [tries, setTries] = useState(0);
  const [pos, setPos] = useState({ x: 94, y: 50 });
  const [yes, setYes] = useState(false);
  const r = useRef(seeded(5));
  const flee = () => {
    const rand = r.current;
    setTries((t) => t + 1);
    // Percent of the arena, and the button is shifted by the same percent of itself, so it never sticks out.
    setPos({ x: 4 + rand() * 92, y: 6 + rand() * 88 });
  };
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-arena">
        {!yes ? (
          <>
            <button className="st-btn accent st-yes" style={{ transform: `scale(${Math.min(1 + tries * 0.12, 1.9)})` }} onClick={() => { setYes(true); ctx.celebrate(); }}>
              {ctx.fill(chapter.yes)}
            </button>
            <button className="st-btn ghost st-no" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-${pos.x}%, -${pos.y}%)` }} onPointerEnter={(e) => { if (e.pointerType === "mouse") flee(); }} onClick={flee}>
              {ctx.fill(chapter.no[tries % chapter.no.length])}
            </button>
          </>
        ) : (
          <div className="st-done">
            <Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={74} className="beat" />
            <p className="st-script">{ctx.fill(chapter.done)}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------------- catch game ---------------- */

type Slot = { key: number; l: number; d: number; gold: boolean; got: boolean };

function Catch({ chapter, ctx, num }: P<"catch">) {
  const [state, setState] = useState<"idle" | "play" | "won" | "lost">("idle");
  const [caught, setCaught] = useState(0);
  const [left, setLeft] = useState(chapter.seconds);
  const [slots, setSlots] = useState<Slot[]>([]);
  const keyRef = useRef(0);
  const rand = useRef(seeded(9));
  const LANES = 6;

  const spawn = (lane: number): Slot => {
    const r = rand.current;
    return { key: keyRef.current++, l: lane * (100 / LANES) + 2 + r() * 6, d: 2.4 + r() * 1.8, gold: r() < 0.18, got: false };
  };
  const start = () => {
    setCaught(0);
    setLeft(chapter.seconds);
    setSlots(Array.from({ length: LANES }, (_, i) => spawn(i)));
    setState("play");
  };
  useEffect(() => {
    if (state !== "play") return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => {
    if (state === "play" && caught >= chapter.target) { setState("won"); ctx.celebrate(); }
    else if (state === "play" && left <= 0) setState("lost");
  }, [caught, left, state, chapter.target, ctx]);

  const grab = (i: number) => {
    const s = slots[i];
    if (!s || s.got) return;
    setCaught((c) => c + (s.gold ? 3 : 1));
    setSlots((all) => all.map((x, k) => (k === i ? { ...x, got: true } : x)));
    setTimeout(() => setSlots((all) => all.map((x, k) => (k === i ? spawn(i) : x))), 420);
  };
  const respawn = (i: number) => setSlots((all) => all.map((x, k) => (k === i && !x.got ? spawn(i) : x)));

  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-catch">
        {state === "play" && (
          <>
            <div className="st-hud">
              <span className="st-chip">{caught} / {chapter.target}</span>
              <span className="st-progress"><span style={{ width: `${Math.min(100, (caught / chapter.target) * 100)}%` }} /></span>
              <span className="st-chip">{Math.max(0, left)}s</span>
            </div>
            {slots.map((s, i) => (
              <button
                key={s.key}
                className={`st-faller${s.got ? " got" : ""}`}
                style={{ left: `${s.l}%`, animationDuration: `${s.d}s` }}
                onPointerDown={() => grab(i)}
                onAnimationEnd={() => respawn(i)}
                aria-label={s.gold ? "Golden one, worth three" : "Catch it"}
              >
                <Motif kind={chapter.item} fill={s.gold ? (ctx.theme.accent3 ?? ctx.theme.accent2) : ctx.theme.accent} size={s.gold ? 46 : 40} className={s.gold ? "gold" : ""} />
              </button>
            ))}
          </>
        )}
        {state === "idle" && (
          <div className="st-center">
            <Motif kind={chapter.item} fill={ctx.theme.accent} size={72} className="beat" />
            <button className="st-btn accent" onClick={start}>Start the game</button>
          </div>
        )}
        {state === "won" && (
          <div className="st-center">
            <p className="st-script big">{ctx.fill(chapter.win)}</p>
            <p className="st-lead center">{ctx.fill(chapter.winSub)}</p>
            <button className="st-btn ghost" onClick={start}>Play again</button>
          </div>
        )}
        {state === "lost" && (
          <div className="st-center">
            <p className="st-script big gold">{ctx.fill(chapter.lose)}</p>
            <p className="st-lead center">{ctx.fill(chapter.loseSub).replace("{caught}", String(caught))}</p>
            <button className="st-btn gold" onClick={start}>Try again</button>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------------- sliding photo puzzle ---------------- */

const SOLVED = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const nbrs = (e: number) => [e - 3, e + 3, e % 3 ? e - 1 : -1, e % 3 < 2 ? e + 1 : -1].filter((x) => x >= 0 && x < 9);

function shuffled(seed: number): number[] {
  const r = seeded(seed);
  const b = [...SOLVED];
  let e = 8, prev = -1;
  for (let i = 0; i < 80; i++) {
    const opts = nbrs(e).filter((x) => x !== prev);
    const pickd = opts[Math.floor(r() * opts.length)];
    [b[e], b[pickd]] = [b[pickd], b[e]];
    prev = e;
    e = pickd;
  }
  return b.every((v, k) => v === k) ? shuffled(seed + 1) : b;
}

function Slide({ chapter, ctx, num }: P<"slide">) {
  const photo = ctx.photos[chapter.photo] ?? ctx.photos[0];
  const [seed, setSeed] = useState(1);
  const [board, setBoard] = useState(() => shuffled(1));
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const solved = board.every((v, k) => v === k);
  const empty = board.indexOf(8);
  useEffect(() => { if (solved && moves > 0) ctx.celebrate(); }, [solved, moves, ctx]);
  const move = (pos: number) => {
    if (solved || !nbrs(empty).includes(pos)) return;
    const b = [...board];
    [b[empty], b[pos]] = [b[pos], b[empty]];
    setBoard(b);
    setMoves((m) => m + 1);
  };
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-pz">
        <div className="st-board">
          {board.map((tile, pos) =>
            tile === 8 && !solved ? null : (
              <button
                key={tile}
                className={`st-tile${nbrs(empty).includes(pos) && !solved ? " movable" : ""}${solved ? " won" : ""}`}
                style={{
                  transform: `translate(${(pos % 3) * 100}%, ${Math.floor(pos / 3) * 100}%)`,
                  backgroundImage: `url(${photo})`,
                  backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                }}
                onClick={() => move(pos)}
                aria-label={`Puzzle piece ${tile + 1}`}
              />
            ),
          )}
          <div className={`st-pz-full${peek || solved ? " show" : ""}${solved ? " done" : ""}`} style={{ backgroundImage: `url(${photo})` }} />
        </div>
        <div className="st-pz-side">
          {!solved ? (
            <>
              <p className="st-lead">Tap a glowing piece next to the empty space to slide it in.</p>
              <div className="row">
                <div className="st-pz-ref" style={{ backgroundImage: `url(${photo})` }} role="img" aria-label="The finished picture" />
                <span className="st-chip">Moves: {moves}</span>
              </div>
            </>
          ) : (
            <>
              <p className="st-script big">{ctx.fill(chapter.solved)}</p>
              <p className="st-lead">{ctx.fill(chapter.solvedSub).replace("{moves}", String(moves))}</p>
            </>
          )}
          <div className="row">
            {!solved && <button className="st-btn gold" onClick={() => setPeek((p) => !p)}>{peek ? "Hide the picture" : "Peek at the picture"}</button>}
            {!solved && moves > 12 && <button className="st-btn ghost" onClick={() => { setBoard([...SOLVED]); setMoves((m) => m + 1); }}>Solve it for me</button>}
            <button className="st-btn ghost" onClick={() => { const s = seed + 1; setSeed(s); setBoard(shuffled(s * 7)); setMoves(0); setPeek(false); }}>Shuffle again</button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- spin the wheel ---------------- */

function Wheel({ chapter, ctx, num }: P<"wheel">) {
  const items = listFrom(ctx, chapter.field, chapter.items, 8, 18);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<string[]>([]);
  const left = chapter.spins - won.length;
  const colors = Array.from({ length: 8 }, (_, i) => ctx.palette[i % ctx.palette.length]);
  const grad = `conic-gradient(${colors.map((c, i) => `${c} ${i * 45}deg ${(i + 1) * 45}deg`).join(",")})`;
  const r = useRef(seeded(21));
  const spin = () => {
    if (spinning || left <= 0) return;
    const target = Math.floor(r.current() * 8);
    // Slice i is centered at i*45+22.5 degrees; bring it under the pin at the top.
    const want = 360 - (target * 45 + 22.5) + (r.current() - 0.5) * 30;
    const next = rot + 360 * 5 + ((want - (rot % 360) + 360) % 360);
    setSpinning(true);
    setRot(next);
    setTimeout(() => {
      setSpinning(false);
      setWon((w) => [...w, items[target]]);
      ctx.toast(`You won: ${items[target]}`);
      if (left === 1) ctx.celebrate();
    }, ctx.reduce ? 200 : 4700);
  };
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-wheel-zone">
        <div className="st-wheel-box">
          <span className="st-wheel-pin" />
          <div className="st-wheel" style={{ background: grad, transform: `rotate(${rot}deg)`, transitionDuration: ctx.reduce ? "0s" : undefined }}>
            {items.map((t, i) => (
              <span key={i} className="st-wlabel" style={{ transform: `rotate(${i * 45 + 22.5 - 90}deg)` }}>{t}</span>
            ))}
          </div>
          <div className="st-wheel-hub"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={30} /></div>
        </div>
        <div className="st-pz-side">
          <button className="st-btn gold" style={{ alignSelf: "flex-start" }} onClick={spin} disabled={spinning || left <= 0}>
            {spinning ? "Spinning…" : left > 0 ? `Spin (${left} left)` : "All spins used"}
          </button>
          {won.length > 0 && (
            <div className="row wrap">
              {won.map((t, i) => (
                <span key={i} className="st-ticket">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>
                  {t}
                </span>
              ))}
            </div>
          )}
          {left <= 0 && <p className="st-script gold">{ctx.fill(chapter.done)}</p>}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- photos ---------------- */

function Gallery({ chapter, ctx, num }: P<"gallery">) {
  const [lift, setLift] = useState<number | null>(null);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className={`st-gallery st-g-${chapter.style}`}>
        {ctx.photos.map((src, i) => (
          <figure key={i} className={`st-pol${lift === i ? " lift" : ""}`} onClick={() => setLift(lift === i ? null : i)}>
            <div className="ph">
              <img src={src} alt={`Memory ${i + 1}`} loading="lazy" />
              <span className="shine" />
            </div>
            <span className="hov" aria-hidden="true">
              <Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={22} />
              <Motif kind={ctx.story.motif} fill={ctx.theme.accent2} size={18} />
              <Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={20} />
            </span>
            {chapter.captions?.[i] && <figcaption>{ctx.fill(chapter.captions[i])}</figcaption>}
          </figure>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- flip cards ---------------- */

function Flips({ chapter, ctx, num }: P<"flips">) {
  const items = listFrom(ctx, chapter.field, chapter.items, Math.min(6, chapter.items.length));
  const [on, setOn] = useState<Set<number>>(new Set());
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-flips">
        {items.map((t, i) => (
          <button key={i} className={`st-flip${on.has(i) ? " on" : ""}`} onClick={() => setOn((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} aria-label={`Reason ${i + 1}`} aria-pressed={on.has(i)}>
            <span className="in">
              <span className="face front"><span className="num">{i + 1}</span><span className="tap">Tap to reveal</span></span>
              <span className="face back">{t}</span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- memory match ---------------- */

function Memory({ chapter, ctx, num }: P<"memory">) {
  const n = Math.min(chapter.pairs, ctx.photos.length);
  const base = useMemo(() => Array.from({ length: n * 2 }, (_, i) => i % n), [n]);
  const [deck, setDeck] = useState(base);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const shuffle = () => {
    const d = [...base];
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    setDeck(d); setOpen([]); setMatched(new Set()); setMoves(0);
  };
  useEffect(shuffle, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = matched.size === n;
  const flip = (k: number) => {
    if (open.length === 2 || open.includes(k) || matched.has(deck[k])) return;
    const o = [...open, k];
    setOpen(o);
    if (o.length === 2) {
      setMoves((m) => m + 1);
      if (deck[o[0]] === deck[o[1]]) {
        const m = new Set(matched).add(deck[k]);
        setTimeout(() => { setMatched(m); setOpen([]); if (m.size === n) ctx.celebrate(); }, 450);
      } else setTimeout(() => setOpen([]), 900);
    }
  };
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className={`st-memory n${n}`}>
        {deck.map((p, k) => {
          const up = open.includes(k) || matched.has(p);
          return (
            <button key={k} className={`st-card${up ? " up" : ""}${matched.has(p) ? " matched" : ""}`} onClick={() => flip(k)} aria-label={up ? `Photo ${p + 1}` : "Hidden card"}>
              <span className="in">
                <span className="face back"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={34} /></span>
                <span className="face front" style={{ backgroundImage: `url(${ctx.photos[p]})` }} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: 20 }}>
        {done ? <p className="st-script gold">{ctx.fill(chapter.done)}</p> : <span className="st-chip">Moves: {moves}</span>}
        {done && <button className="st-btn ghost" onClick={shuffle}>Play again</button>}
      </div>
    </Section>
  );
}

/* ---------------- scratch card ---------------- */

function Scratch({ chapter, ctx, num }: P<"scratch">) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  const last = useRef(0);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { width, height } = c.getBoundingClientRect();
    c.width = width * dpr;
    c.height = height * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const grad = g.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, ctx.theme.accent);
    grad.addColorStop(1, ctx.theme.accent2);
    g.fillStyle = grad;
    g.fillRect(0, 0, width, height);
    const r = seeded(4);
    g.fillStyle = "rgba(255,255,255,.18)";
    for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(r() * width, r() * height, 2 + r() * 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = ctx.theme.onAccent;
    g.font = `600 18px ${getComputedStyle(c).fontFamily}`;
    g.textAlign = "center";
    g.fillText(ctx.fill(chapter.cover), width / 2, height / 2 + 6);
  }, [ctx, chapter.cover]);
  const scratch = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || done) return;
    const c = canvas.current!;
    const b = c.getBoundingClientRect();
    const g = c.getContext("2d")!;
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(e.clientX - b.left, e.clientY - b.top, 24, 0, Math.PI * 2);
    g.fill();
    const now = performance.now();
    if (now - last.current < 150) return;
    last.current = now;
    const data = g.getImageData(0, 0, c.width, c.height).data;
    let clear = 0;
    for (let i = 3; i < data.length; i += 64) if (data[i] === 0) clear++;
    if (clear / (data.length / 64) > 0.5) { setDone(true); ctx.celebrate(); }
  };
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-scratch">
        <p className="st-reveal">{ctx.fill(chapter.reveal)}</p>
        <canvas
          ref={canvas}
          className={done ? "gone" : ""}
          onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
          onPointerMove={scratch}
          onPointerUp={() => (drawing.current = false)}
          aria-label="Scratch card. Rub to reveal."
          role="img"
        />
      </div>
      {!done && <button className="st-btn ghost" style={{ marginTop: 18 }} onClick={() => { setDone(true); ctx.celebrate(); }}>Just show me</button>}
    </Section>
  );
}

/* ---------------- rituals ---------------- */

function Ritual({ chapter, ctx, num }: P<"ritual">) {
  const k = chapter.kind;
  const single = k === "champagne" || k === "lovelock" || k === "ringbox";
  const count = single ? 1 : chapter.count;
  // Candles start lit and get blown out; diyas, lanterns and rockets start waiting.
  const [state, setState] = useState<boolean[]>(() => Array(count).fill(false));
  const finished = state.every(Boolean);
  useEffect(() => { if (finished) ctx.celebrate(); }, [finished, ctx]);
  const act = (i: number) => setState((s) => s.map((v, j) => (j === i ? true : v)));
  const reset = () => setState(Array(count).fill(false));
  return (
    <Section center className={`st-ritual st-r-${k}`}>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-r-zone">
        {k === "candles" && (
          <div className="st-cake">
            <div className="candles">
              {state.map((out, i) => (
                <button key={i} className={`candle${out ? " out" : ""}`} onClick={() => act(i)} aria-label={`Blow out candle ${i + 1}`} disabled={out}>
                  <Obj name="candle" size={64} />
                  {out && <span className="smoke" />}
                </button>
              ))}
            </div>
            <Obj name="birthday_cake" size={300} className="cake3d" />
          </div>
        )}
        {k === "diyas" && (
          <div className="st-diyas">
            {state.map((lit, i) => (
              <button key={i} className={`diya${lit ? " lit" : ""}`} onClick={() => act(i)} aria-label={`Light diya ${i + 1}`} disabled={lit}>
                <Obj name="diya_lamp" size={84} />
              </button>
            ))}
          </div>
        )}
        {k === "champagne" && (
          <button className={`st-bottle${finished ? " popped" : ""}`} onClick={() => act(0)} aria-label="Pop the champagne" disabled={finished}>
            <Obj name="bottle_with_popping_cork" size={220} className="bottle3d" />
            {finished && <Obj name="clinking_glasses" size={130} className="glasses3d" />}
            {finished && <span className="foam">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }} />)}</span>}
          </button>
        )}
        {k === "lovelock" && <LoveLock done={finished} onDo={() => act(0)} ctx={ctx} />}
        {k === "ringbox" && <RingBox done={finished} onDo={() => act(0)} ctx={ctx} />}
        {(k === "lanterns" || k === "rockets") && (
          <div className="st-launch">
            {state.map((up, i) => (
              <button key={i} className={`item${up ? " up" : ""}`} style={{ animationDelay: `${i * 0.2}s` }} onClick={() => act(i)} aria-label={`Release ${k === "rockets" ? "rocket" : "lantern"} ${i + 1}`} disabled={up}>
                {k === "lanterns" ? (
                  <Floater kind="lanterns" color={ctx.palette[i % ctx.palette.length]} w={52} />
                ) : (
                  <Obj name="rocket" size={76} className="rocket3d" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {finished ? (
        <div className="st-r-done">
          <p className="st-script big gold">{ctx.fill(chapter.done)}</p>
          <button className="st-btn ghost" onClick={reset}>{ctx.fill(chapter.again)}</button>
        </div>
      ) : (
        !single && <p className="st-lead center" style={{ marginTop: 18 }}>{state.filter(Boolean).length} of {count}</p>
      )}
    </Section>
  );
}

/* ---------------- letter ---------------- */

function Letter({ chapter, ctx, num }: P<"letter">) {
  const text = (ctx.values[chapter.field] ?? "").trim();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!open) return;
    if (ctx.reduce) { setShown(text.length); return; }
    const t = setInterval(() => setShown((s) => { if (s >= text.length) { clearInterval(t); return s; } return s + 2; }), 32);
    return () => clearInterval(t);
  }, [open, text, ctx.reduce]);
  const typing = open && shown < text.length;
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      {!open ? (
        <button className={`st-env st-env-${chapter.style}`} onClick={() => setOpen(true)} aria-label="Open the letter">
          {chapter.style === "envelope" && (
            <span className="o3d"><Obj name={isRomantic(ctx.story.motif) ? "love_letter" : "envelope"} size={210} />{!isRomantic(ctx.story.motif) && <span className="seal"><Motif kind={ctx.story.motif} fill={ctx.theme.paper} size={40} /></span>}</span>
          )}
          {chapter.style === "bottle" && (
            <svg width="220" height="130" viewBox="0 0 220 130" aria-hidden="true">
              <path d="M20 40h120c30 0 44 12 54 18h14v14h-14c-10 6-24 18-54 18H20a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16z" fill="rgba(180,230,230,.35)" stroke="var(--fg)" strokeOpacity=".5" strokeWidth="2" />
              <rect x="206" y="54" width="12" height="22" rx="3" fill="#8a5a2b" />
              <rect x="40" y="52" width="100" height="26" rx="10" fill="var(--paper)" transform="rotate(-4 90 65)" />
              <path d="M52 62h76M52 70h60" stroke="var(--paper-ink)" strokeOpacity=".4" strokeWidth="2" transform="rotate(-4 90 65)" />
            </svg>
          )}
          {chapter.style === "scroll" && (
            <span className="scr"><span className="rod" /><span className="roll"><span className="tie"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={22} /></span></span><span className="rod" /></span>
          )}
          {chapter.style === "postcard" && (
            <span className="pc">
              <span className="pc-pic" style={{ backgroundImage: ctx.photos[0] ? `url(${ctx.photos[0]})` : undefined }} />
              <span className="pc-lines"><i /><i /><i /></span>
              <span className="pc-stamp"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={22} /></span>
            </span>
          )}
          {chapter.style === "terminal" && (
            <span className="term"><span className="bar"><i /><i /><i /></span><span className="cmd">&gt; open message_for_{(ctx.values.recipient_name || "you").toLowerCase().replace(/\W+/g, "_")}.txt<span className="caret" /></span></span>
          )}
        </button>
      ) : (
        <>
          <div className={`st-paper st-paper-${chapter.style}`}>
            {text.slice(0, shown)}
            {typing && <span className="caret" />}
            {!typing && <p className="sig">{ctx.fill("— {{sender_name}}")}</p>}
          </div>
          {typing && <button className="st-btn ghost" style={{ marginTop: 20 }} onClick={() => setShown(text.length)}>Show it all</button>}
        </>
      )}
    </Section>
  );
}

/* ---------------- finale ---------------- */

function Finale({ chapter, ctx }: P<"finale">) {
  const [on, setOn] = useState(false);
  const sky = useMemo(() => {
    const r = seeded(17);
    return {
      stars: Array.from({ length: 50 }, (_, i) => ({ i, l: r() * 100, t: r() * 100, z: 1 + r() * 2.2, d: 1.5 + r() * 3, dl: -r() * 4 })),
      works: Array.from({ length: 7 }, (_, i) => ({ i, x: 10 + r() * 80, y: 14 + r() * 50, dl: r() * 2.4, c: ctx.palette[i % ctx.palette.length] })),
      rain: Array.from({ length: 34 }, (_, i) => ({ i, l: r() * 100, d: 4 + r() * 4, dl: r() * 4, z: 14 + r() * 22, c: ctx.palette[i % ctx.palette.length] })),
    };
  }, [ctx.palette]);
  const start = () => { setOn(true); ctx.celebrate(); ctx.finished(); };
  return (
    <Section center className="st-finale-sec">
      <div className="st-head center">
        <p className="st-eyebrow">{ctx.fill(chapter.eyebrow)}</p>
        <h2 className="st-h2">{ctx.fill(chapter.title)}</h2>
      </div>
      <div className={`st-sky st-sky-${chapter.effect}`}>
        {sky.stars.map((s) => <span key={s.i} className="st-star" style={{ left: `${s.l}%`, top: `${s.t}%`, width: s.z, height: s.z, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` }} />)}
        {!on ? (
          <div className="st-center inline">
            {chapter.lead && <p className="st-lead center">{ctx.fill(chapter.lead)}</p>}
            <button className="st-btn gold" onClick={start}>{ctx.fill(chapter.button)}</button>
          </div>
        ) : (
          <>
            {chapter.effect === "fireworks" && !ctx.reduce &&
              sky.works.map((w) => (
                <div key={w.i} className="st-fw" style={{ left: `${w.x}%`, top: `${w.y}%` }}>
                  {Array.from({ length: 14 }, (_, k) => (
                    <span key={k} style={{ transform: `rotate(${k * (360 / 14)}deg)` }}><i style={{ background: w.c, boxShadow: `0 0 10px ${w.c}`, animationDelay: `${w.dl}s` }} /></span>
                  ))}
                </div>
              ))}
            {(chapter.effect === "hearts" || chapter.effect === "petals") && !ctx.reduce && (
              <div className={`st-rain st-rain-${chapter.effect}`} aria-hidden="true">
                {sky.rain.map((d) => (
                  <span key={d.i} style={{ left: `${d.l}%`, animationDuration: `${d.d}s`, animationDelay: `${d.dl}s` }}>
                    <Motif kind={chapter.effect === "hearts" ? "heart" : "petal"} fill={d.c} size={d.z} />
                  </span>
                ))}
              </div>
            )}
            <div className="st-finale-copy">
              <p className="st-finale-name">{ctx.fill(chapter.headline)}</p>
              <p className="st-lead center">{ctx.fill(chapter.signoff)}</p>
              <button className="st-btn gold" onClick={() => { setOn(false); setTimeout(start, 60); }}>Again!</button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

export const CHAPTERS = {
  hero: Hero,
  question: Question,
  catch: Catch,
  slide: Slide,
  wheel: Wheel,
  gallery: Gallery,
  flips: Flips,
  memory: Memory,
  scratch: Scratch,
  ritual: Ritual,
  letter: Letter,
  finale: Finale,
  ...LOVE_CHAPTERS,
  ...INVITE_CHAPTERS,
  ...WEDDING_CHAPTERS,
} as const;

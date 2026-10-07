"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Chapter } from "@/lib/templates/schema";
import { Motif, seeded } from "./art";
import { Head, listFrom, Section } from "./chapters";
import type { StoryContext } from "./Story";

/* Chapters made for love stories: anniversaries and proposals. */

type Of<T extends Chapter["type"]> = Extract<Chapter, { type: T }>;
type P<T extends Chapter["type"]> = { chapter: Of<T>; ctx: StoryContext; num: number | null };

export function useInView(ref: RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

/** "a | b | c" lines, trimmed, empty parts dropped. */
const parts = (line: string) => line.split("|").map((s) => s.trim()).filter(Boolean);
const fmt = (n: number) => Math.floor(n).toLocaleString("en-IN");

/* ---------------- days together ---------------- */

function Counter({ chapter, ctx, num }: P<"counter">) {
  const raw = ctx.values[chapter.field] ?? "";
  const since = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : null;
  const valid = !!since && !Number.isNaN(since.getTime()) && since.getTime() < Date.now();
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box);
  const [now, setNow] = useState(() => Date.now());
  const [grow, setGrow] = useState(0);
  useEffect(() => {
    if (!seen || !valid) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [seen, valid]);
  useEffect(() => {
    if (!seen) return;
    if (ctx.reduce) { setGrow(1); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 2200);
      setGrow(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, ctx.reduce]);
  const ms = valid ? now - since!.getTime() : 0;
  const days = ms / 864e5;
  let months = 0, years = 0;
  if (valid) {
    const d = new Date(now);
    months = (d.getFullYear() - since!.getFullYear()) * 12 + d.getMonth() - since!.getMonth() - (d.getDate() < since!.getDate() ? 1 : 0);
    years = Math.floor(months / 12);
  }
  const stats = [
    { n: years, l: years === 1 ? "year" : "years" },
    { n: months, l: "months" },
    { n: days / 7, l: "weeks" },
    { n: ms / 36e5, l: "hours" },
    { n: ms / 6e4, l: "minutes" },
    { n: ms / 1e3, l: "seconds" },
  ];
  return (
    <Section center className="st-counter-sec">
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-counter" ref={box}>
        {valid ? (
          <>
            <div className="st-days">
              <Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={34} className="beat" />
              <b>{fmt(days * grow)}</b>
              <span>days together</span>
            </div>
            <div className="st-stats">
              {stats.map((s) => (
                <div key={s.l} className="st-stat"><b>{fmt(s.n * grow)}</b><span>{s.l}</span></div>
              ))}
            </div>
            <p className="st-lead center">And about <b className="hl">{fmt(days * 103000 * grow)}</b> heartbeats, side by side.</p>
          </>
        ) : (
          <p className="st-script big">{ctx.fill(chapter.fallback)}</p>
        )}
        <p className="st-script gold">{ctx.fill(chapter.done)}</p>
      </div>
    </Section>
  );
}

/* ---------------- timeline ---------------- */

function Timeline({ chapter, ctx, num }: P<"timeline">) {
  const items = listFrom(ctx, chapter.field, chapter.items, Math.min(6, Math.max(3, chapter.items.length)), 140).map((l) => {
    const p = parts(l);
    return p.length > 1 ? { when: p[0], what: p.slice(1).join(" · ") } : { when: "", what: p[0] ?? l };
  });
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setAt(Math.round((el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)) * (items.length - 1)));
  };
  return (
    <Section className="st-tl-sec">
      <Head chapter={chapter} ctx={ctx} num={num} />
      {!ctx.swipe && <p className="st-tl-hint">Scroll sideways through our story <span aria-hidden="true">→</span></p>}
      <div className="st-tl" ref={track} onScroll={onScroll}>
        <span className="st-tl-line" aria-hidden="true" />
        {items.map((it, i) => (
          <article key={i} className={`st-tl-item${ctx.swipe || i <= at ? " on" : ""}`}>
            <span className="st-tl-dot" aria-hidden="true"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={18} /></span>
            {it.when && <span className="st-tl-when">{it.when}</span>}
            {ctx.photos.length > 0 && <div className="st-tl-ph" style={{ backgroundImage: `url(${ctx.photos[i % ctx.photos.length]})` }} role="img" aria-label={`Photo ${i + 1}`} />}
            <p className="st-tl-what">{it.what}</p>
          </article>
        ))}
        <article className="st-tl-item end">
          <span className="st-tl-dot" aria-hidden="true"><Motif kind={ctx.story.motif} fill={ctx.theme.accent3 ?? ctx.theme.accent} size={22} /></span>
          <span className="st-tl-when">Next</span>
          <p className="st-script">Everything still to come</p>
        </article>
      </div>
    </Section>
  );
}

/* ---------------- connect the stars ---------------- */

const SHAPES: Record<string, [number, number][]> = {
  heart: [[50, 30], [62, 16], [78, 14], [90, 28], [88, 46], [72, 64], [50, 86], [28, 64], [12, 46], [10, 28], [22, 14], [38, 16]],
  ring: [[50, 34], [66, 40], [74, 56], [70, 74], [56, 84], [40, 84], [28, 74], [26, 56], [34, 40], [50, 34], [44, 22], [50, 12], [56, 22]],
  infinity: [[50, 50], [62, 36], [78, 30], [92, 40], [94, 58], [80, 70], [64, 64], [50, 50], [36, 36], [20, 30], [8, 42], [8, 60], [22, 70], [38, 64]],
};

function Stars({ chapter, ctx, num }: P<"stars">) {
  const pts = SHAPES[chapter.shape];
  // Points that repeat (closing the shape) are visited again, not drawn twice.
  const order = useMemo(() => pts.map((p, i) => pts.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i), [pts]);
  const total = pts.length;
  const [n, setN] = useState(0);
  const done = n >= total;
  useEffect(() => {
    // Skip points that only close a loop: they are already on the board.
    if (n < total && !order[n]) setN((x) => x + 1);
  }, [n, order, total]);
  useEffect(() => { if (done) ctx.celebrate(); }, [done, ctx]);
  const path = pts.slice(0, n).map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + (done && chapter.shape === "heart" ? " Z" : "");
  const sky = useMemo(() => {
    const r = seeded(31);
    return Array.from({ length: 40 }, (_, i) => ({ i, x: r() * 100, y: r() * 100, z: 0.3 + r() * 0.5, d: 1.5 + r() * 3 }));
  }, []);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className={`st-cons${done ? " done" : ""}`}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {sky.map((s) => <circle key={s.i} cx={s.x} cy={s.y} r={s.z} className="tw" style={{ animationDuration: `${s.d}s` }} />)}
          <path d={path} className="ln" />
          {done && <path d={path} className="glow" />}
        </svg>
        {pts.map((p, i) =>
          order[i] ? (
            <button
              key={i}
              className={`st-cstar${i < n ? " lit" : ""}${i === n ? " next" : ""}`}
              style={{ left: `${p[0]}%`, top: `${p[1]}%` }}
              onClick={() => { if (i === n) setN(n + 1); else if (i > n) ctx.toast("Follow the glowing star"); }}
              aria-label={`Star ${i + 1}`}
              disabled={i < n}
            >
              <Motif kind="star" fill="currentColor" size={i === n ? 26 : 18} />
            </button>
          ) : null,
        )}
      </div>
      {done ? (
        <p className="st-script big gold st-cons-reveal">{ctx.fill(chapter.reveal)}</p>
      ) : (
        <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
          <span className="st-chip">{n} of {total} stars</span>
          {n > 3 && <button className="st-btn ghost" onClick={() => setN(total)}>Finish it for me</button>}
        </div>
      )}
    </Section>
  );
}

/* ---------------- love meter ---------------- */

function Meter({ chapter, ctx, num }: P<"meter">) {
  const [v, setV] = useState(0);
  const holding = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const full = v >= 120;
  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(() => { if (full) { ctx.celebrate(); holding.current = false; clearInterval(timer.current); } }, [full, ctx]);
  const start = () => {
    if (holding.current || full) return;
    holding.current = true;
    clearInterval(timer.current);
    timer.current = setInterval(() => setV((x) => Math.min(120, x + 2.2)), 40);
  };
  const stop = () => {
    holding.current = false;
    clearInterval(timer.current);
    if (!full) timer.current = setInterval(() => setV((x) => (x <= 0 ? 0 : Math.max(0, x - 0.6))), 40);
  };
  const lvl = chapter.levels[Math.min(chapter.levels.length - 1, Math.floor((Math.min(v, 99.9) / 100) * chapter.levels.length))];
  const fill = Math.min(100, v);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className={`st-meter${full ? " full" : ""}`}>
        <svg viewBox="0 0 24 22" className="st-meter-heart" aria-hidden="true">
          <defs>
            <clipPath id="st-mh"><path d="M12 21s-7.5-4.6-9.7-9.4C.8 8.1 2.9 4 6.8 4c2.2 0 3.8 1.2 5.2 3 1.4-1.8 3-3 5.2-3 3.9 0 6 4.1 4.5 7.6C19.5 16.4 12 21 12 21z" /></clipPath>
          </defs>
          <path d="M12 21s-7.5-4.6-9.7-9.4C.8 8.1 2.9 4 6.8 4c2.2 0 3.8 1.2 5.2 3 1.4-1.8 3-3 5.2-3 3.9 0 6 4.1 4.5 7.6C19.5 16.4 12 21 12 21z" className="bg" />
          <g clipPath="url(#st-mh)">
            <rect x="0" y={22 - (fill / 100) * 18 - 3.4} width="24" height="22" className="liq" />
            <path d={`M0 ${22 - (fill / 100) * 18 - 3.4} q3 -1.2 6 0 t6 0 t6 0 t6 0 v2 h-24z`} className="wave" />
          </g>
        </svg>
        <p className="st-meter-pct">{full ? "∞" : `${Math.round(v)}%`}</p>
        <p className="st-meter-lvl">{full ? ctx.fill(chapter.done) : ctx.fill(lvl)}</p>
        {!full ? (
          <button
            className={`st-btn accent st-hold${holding.current ? " on" : ""}`}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start(); }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(); } }}
            onKeyUp={stop}
            onContextMenu={(e) => e.preventDefault()}
          >
            Press and hold
          </button>
        ) : (
          <button className="st-btn ghost" onClick={() => setV(0)}>Measure again</button>
        )}
      </div>
    </Section>
  );
}

/* ---------------- bouquet ---------------- */

const STEMS = [
  { x: 50, y: 18, r: 0 }, { x: 32, y: 30, r: -16 }, { x: 68, y: 30, r: 16 }, { x: 18, y: 46, r: -30 },
  { x: 82, y: 46, r: 30 }, { x: 40, y: 44, r: -8 }, { x: 60, y: 44, r: 8 },
];

function Bouquet({ chapter, ctx, num }: P<"bouquet">) {
  const items = listFrom(ctx, chapter.field, chapter.items, Math.min(7, chapter.items.length));
  const [n, setN] = useState(0);
  const done = n >= items.length;
  useEffect(() => { if (done) ctx.celebrate(); }, [done, ctx]);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-bq">
        <div className="st-bq-art">
          <svg viewBox="0 0 100 100" className="stems" aria-hidden="true">
            {STEMS.slice(0, items.length).map((s, i) => (
              <path key={i} d={`M50 92 Q${(50 + s.x) / 2} ${(92 + s.y) / 2 + 8} ${s.x} ${s.y + 6}`} className={i < n ? "on" : ""} />
            ))}
          </svg>
          {STEMS.slice(0, items.length).map((s, i) => (
            <span key={i} className={`st-bloom${i < n ? " on" : ""}`} style={{ left: `${s.x}%`, top: `${s.y}%`, rotate: `${s.r}deg` }} aria-hidden="true">
              <Motif kind={i % 3 === 1 ? "petal" : "rose"} fill={ctx.palette[i % ctx.palette.length]} size={i === 0 ? 70 : 56} />
            </span>
          ))}
          <svg viewBox="0 0 100 60" className="wrap" aria-hidden="true">
            <path d="M22 2l28 56 28-56c-10 6-18 8-28 8S32 8 22 2z" />
            <path d="M42 22c4 4 12 4 16 0l-4 8h-8z" className="bow" />
          </svg>
        </div>
        <div className="st-bq-side">
          <ol className="st-bq-notes">
            {items.slice(0, n).map((t, i) => (
              <li key={i} style={{ animationDelay: "0s" }}>
                <Motif kind={i % 3 === 1 ? "petal" : "rose"} fill={ctx.palette[i % ctx.palette.length]} size={22} />
                <span>{t}</span>
              </li>
            ))}
          </ol>
          {!done ? (
            <button className="st-btn accent" onClick={() => setN(n + 1)}>{n ? "Add another flower" : "Add the first flower"} ({items.length - n} left)</button>
          ) : (
            <>
              <p className="st-script gold">{ctx.fill(chapter.done)}</p>
              <button className="st-btn ghost" onClick={() => setN(0)}>Pick them again</button>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- quiz ---------------- */

function Quiz({ chapter, ctx, num }: P<"quiz">) {
  const qs = useMemo(() => {
    const lines = listFrom(ctx, chapter.field, chapter.items, Math.min(5, chapter.items.length), 240);
    const r = seeded(13);
    return lines
      .map(parts)
      .filter((p) => p.length >= 3)
      .map(([q, right, ...wrong]) => {
        const opts = [right, ...wrong.slice(0, 3)];
        for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
        return { q, opts, right: opts.indexOf(right) };
      });
  }, [ctx, chapter.field, chapter.items]);
  const [at, setAt] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const over = at >= qs.length;
  useEffect(() => { if (over && score === qs.length) ctx.celebrate(); }, [over, score, qs.length, ctx]);
  if (!qs.length) return null;
  const q = qs[Math.min(at, qs.length - 1)];
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (i === q.right) setScore((s) => s + 1);
  };
  const fillScore = (s: string) => ctx.fill(s).replace("{score}", String(score)).replace("{total}", String(qs.length));
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-quiz">
        {!over ? (
          <>
            <div className="st-quiz-top">
              <span className="st-chip">Question {at + 1} of {qs.length}</span>
              <span className="st-quiz-dots" aria-hidden="true">{qs.map((_, i) => <i key={i} className={i < at ? "done" : i === at ? "now" : ""} />)}</span>
            </div>
            <p className="st-quiz-q">{q.q}</p>
            <div className="st-quiz-opts">
              {q.opts.map((o, i) => (
                <button
                  key={`${at}-${i}`}
                  className={`st-opt${pick !== null && i === q.right ? " right" : ""}${pick === i && i !== q.right ? " wrong" : ""}`}
                  onClick={() => choose(i)}
                  disabled={pick !== null && i !== pick && i !== q.right}
                >
                  <span className="k">{String.fromCharCode(65 + i)}</span>{o}
                </button>
              ))}
            </div>
            {pick !== null && (
              <button className="st-btn gold" onClick={() => { setPick(null); setAt(at + 1); }}>
                {at + 1 < qs.length ? "Next question" : "See my score"}
              </button>
            )}
          </>
        ) : (
          <div className="st-center inline">
            <p className="st-quiz-score"><b>{score}</b>/{qs.length}</p>
            <p className="st-script big">{fillScore(score >= Math.ceil(qs.length / 2) ? chapter.win : chapter.lose)}</p>
            <button className="st-btn ghost" onClick={() => { setAt(0); setScore(0); setPick(null); }}>Play again</button>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------------- promises ---------------- */

function Promises({ chapter, ctx, num }: P<"promises">) {
  const items = listFrom(ctx, chapter.field, chapter.items, Math.min(6, chapter.items.length));
  const [sealed, setSealed] = useState<Set<number>>(new Set());
  const all = sealed.size >= items.length;
  useEffect(() => { if (all) ctx.celebrate(); }, [all, ctx]);
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <div className="st-prom">
        {items.map((t, i) => (
          <button key={i} className={`st-promise${sealed.has(i) ? " sealed" : ""}`} onClick={() => setSealed((s) => new Set(s).add(i))} disabled={sealed.has(i)}>
            <span className="t"><span className="pre">I promise</span>{t}</span>
            <span className="wax" aria-hidden="true"><Motif kind={ctx.story.motif} fill="rgba(255,255,255,.75)" size={22} /></span>
            {!sealed.has(i) && <span className="tap">Tap to seal</span>}
          </button>
        ))}
      </div>
      {all && <p className="st-script gold" style={{ marginTop: 24, textAlign: "center" }}>{ctx.fill(chapter.done)}</p>}
    </Section>
  );
}

/* ---------------- rituals: love lock, ring box ---------------- */

const initial = (s?: string) => (s ?? "").trim().charAt(0).toUpperCase() || "♥";

export function LoveLock({ done, onDo, ctx }: { done: boolean; onDo(): void; ctx: StoryContext }) {
  return (
    <button className={`st-lock${done ? " shut" : ""}`} onClick={onDo} disabled={done} aria-label="Close the love lock and throw away the key">
      <svg viewBox="0 0 260 220" aria-hidden="true">
        <g className="rail">
          <path d="M0 70h260M0 160h260" />
          {[20, 60, 100, 140, 180, 220, 260].map((x) => <path key={x} d={`M${x - 20} 70l40 90M${x + 20} 70l-40 90`} />)}
        </g>
        <g className="lockg">
          <path className="shackle" d="M104 104V78a26 26 0 0 1 52 0v26" />
          <rect x="88" y="100" width="84" height="74" rx="14" className="body" />
          <text x="130" y="146" textAnchor="middle" className="ini">{initial(ctx.values.sender_name)} ♥ {initial(ctx.values.recipient_name)}</text>
        </g>
        <path className="water" d="M0 206c22-8 43-8 65 0s43 8 65 0 43-8 65 0 43 8 65 0v14H0z" />
      </svg>
      <span className="key"><Motif kind="key" fill={ctx.theme.accent3 ?? ctx.theme.accent} size={40} /></span>
      {done && <span className="splash" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  );
}

export function RingBox({ done, onDo, ctx }: { done: boolean; onDo(): void; ctx: StoryContext }) {
  return (
    <button className={`st-rbox${done ? " open" : ""}`} onClick={onDo} disabled={done} aria-label="Open the ring box">
      <span className="lid" />
      <span className="base"><span className="cushion" /></span>
      <span className="ring"><Motif kind="ring" fill={ctx.theme.accent3 ?? ctx.theme.accent} size={86} /></span>
      {done && <span className="sparks" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ rotate: `${i * 45}deg` }} />)}</span>}
    </button>
  );
}

export const LOVE_CHAPTERS = {
  counter: Counter,
  timeline: Timeline,
  stars: Stars,
  meter: Meter,
  bouquet: Bouquet,
  quiz: Quiz,
  promises: Promises,
} as const;

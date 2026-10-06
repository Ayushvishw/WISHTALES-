"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { audioLevel, isPlaying, playAudio, stopAudio } from "@/experience/audio";
import { useReducedMotion } from "@/experience/hooks";
import type { PublicExperience } from "@/lib/orders/service";
import { fillText } from "@/lib/personalization";
import type { Chapter, Story, Theme } from "@/lib/templates/schema";
import { isRomantic, Motif, seeded } from "./art";
import { Obj, type ObjName } from "./obj";
import { CHAPTERS } from "./chapters";
import "./story.css";
import "./skins.css";
import "./love.css";
import "./love-skins.css";

export type StoryContext = {
  values: Record<string, string>;
  photos: string[];
  theme: Theme;
  story: Story;
  reduce: boolean;
  /** "swipe" stories show one chapter per screen and move sideways. */
  swipe: boolean;
  /** Colors for game pieces, wheel slices and confetti. */
  palette: string[];
  fill(s: string): string;
  toast(msg: string): void;
  celebrate(): void;
  scrollToNext(from: HTMLElement | null): void;
  finished(): void;
};

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
}

function vars(t: Theme, s: Story): CSSProperties {
  return {
    "--bg": t.bg, "--fg": t.fg, "--muted": t.muted, "--line": t.line, "--card": t.card,
    "--accent": t.accent, "--accent2": t.accent2, "--accent3": t.accent3 ?? t.accent2, "--on-accent": t.onAccent,
    "--paper": t.paper, "--paper-ink": t.paperInk,
    "--display": t.display, "--body": t.body, "--letter": t.letter, "--script": t.hand,
    "--backdrop": s.backdrop ?? t.bg,
    colorScheme: isDark(t.bg) ? "dark" : "light",
  } as CSSProperties;
}

class ChapterBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.error("Chapter failed", e);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** A tiled, tilted text pattern for the watermark layer. */
function watermarkTile(text: string) {
  const esc = text.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><g transform="rotate(-24 150 85)" font-family="system-ui,sans-serif" font-size="17" font-weight="700" letter-spacing="2" fill="#fff" stroke="#000" stroke-opacity=".35" stroke-width=".6"><text x="10" y="70">${esc}</text><text x="160" y="155">${esc}</text></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Guards for pages that show an experience before it is bought. */
export type Protect = {
  /** Faint moving text across the whole experience, e.g. "Sample · WishTales". */
  watermark: string;
  /** When set, the letter and finale are held back and this call to action shows in their place. */
  locked?: ReactNode;
};

type Props = {
  experience: PublicExperience;
  ribbon?: string;
  protect?: Protect;
  onEvent?(name: "experience_completed"): void;
};

type Piece = { id: number; l: number; w: number; h: number; c: string; d: number; dl: number };

/** One story made of chapters (games, photos, a letter, a finale): a long scrolling page, or swipeable screens. */
export function StoryExperience({ experience, ribbon, protect, onEvent }: Props) {
  const { config, values, photos, music } = experience;
  const story = config.story!;
  const theme = config.theme;
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const [playing, setPlaying] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [confetti, setConfetti] = useState<Piece[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const confettiId = useRef(0);
  const done = useRef(false);
  const swipe = story.flow === "swipe";
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);

  const palette = useMemo(
    () => [...new Set([theme.accent, theme.accent2, theme.accent3 ?? theme.accent2, ...theme.fx, ...story.ambient.colors])],
    [theme, story],
  );

  const celebrate = useCallback(() => {
    if (reduce) return;
    const r = seeded(Date.now() & 0xffff);
    const batch = Array.from({ length: 70 }, () => ({
      id: confettiId.current++,
      l: r() * 100, w: 6 + r() * 8, h: 8 + r() * 10,
      c: palette[Math.floor(r() * palette.length)], d: 2.6 + r() * 2.2, dl: r() * 0.9,
    }));
    setConfetti((c) => [...c, ...batch]);
    setTimeout(() => setConfetti((c) => c.filter((p) => !batch.includes(p))), 6000);
  }, [palette, reduce]);

  const toast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastOn(true);
    toastTimer.current = setTimeout(() => setToastOn(false), 3200);
  }, []);

  const startMusic = useCallback(() => {
    if (!music) return;
    setPlaying(playAudio(music.source));
  }, [music]);

  useEffect(() => () => { stopAudio(); clearTimeout(toastTimer.current); }, []);

  // Let visuals breathe with the music: CSS variables updated every frame, no re-renders.
  useEffect(() => {
    if (!playing || reduce) return;
    let raf = 0;
    const el = root.current;
    const tick = () => {
      const a = audioLevel();
      if (el && a) {
        el.style.setProperty("--lvl", a.lvl.toFixed(3));
        a.bands.forEach((b, i) => el.style.setProperty(`--b${i + 1}`, b.toFixed(3)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el?.style.setProperty("--lvl", "0");
    };
  }, [playing, reduce]);

  const open = () => {
    if (phase !== "closed") return;
    startMusic();
    setPhase("opening");
    setTimeout(() => { setPhase("open"); celebrate(); }, reduce ? 50 : 1100);
  };

  const ctx: StoryContext = useMemo(
    () => ({
      values, photos, theme, story, reduce, swipe, palette,
      fill: (s: string) => fillText(s, values),
      toast,
      celebrate,
      scrollToNext: (from) => {
        let next = from?.closest("section")?.nextElementSibling ?? null;
        while (next && next.tagName !== "SECTION") next = next.nextElementSibling;
        // Scroll only the story's own scroller, never the page around it (the home page embeds a live story).
        const box = from?.closest(".st-scroll");
        if (!next || !box) return;
        const at = next as HTMLElement;
        box.scrollTo(swipe ? { left: at.offsetLeft, behavior: reduce ? "auto" : "smooth" } : { top: at.offsetTop, behavior: reduce ? "auto" : "smooth" });
      },
      finished: () => {
        if (done.current) return;
        done.current = true;
        onEvent?.("experience_completed");
      },
    }),
    [values, photos, theme, story, reduce, swipe, palette, toast, celebrate, onEvent],
  );

  // Swipe stories: keep track of the screen in view for the progress bar and arrows.
  useEffect(() => {
    const box = scroller.current;
    if (!swipe || phase !== "open" || !box) return;
    const measure = () => {
      setPages(box.querySelectorAll(":scope > section").length);
      setPage(Math.round(box.scrollLeft / Math.max(1, box.clientWidth)));
    };
    measure();
    box.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { box.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [swipe, phase]);
  const go = (to: number) => {
    const box = scroller.current;
    if (!box) return;
    const target = Math.max(0, Math.min(pages - 1, to));
    box.scrollTo({ left: target * box.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  let n = 1;
  const shown = protect?.locked ? story.chapters.filter((c) => c.type !== "letter" && c.type !== "finale") : story.chapters;
  const numbered = shown.map((c) => {
    const num = c.type === "hero" || c.type === "finale" ? null : ++n;
    return { c, num };
  });

  return (
    <div
      className={`st${protect ? " st-guard" : ""}`}
      ref={root}
      style={vars(theme, story)}
      data-motif={story.motif}
      data-skin={story.skin}
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
      onDragStart={protect ? (e) => e.preventDefault() : undefined}
    >
      {theme.fonts && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${theme.fonts}&display=swap`} precedence="story" />}
      <Ambient story={story} reduce={reduce} />
      {story.skin && <div className="st-skin back" aria-hidden="true"><span className="big" /><span className="b2" /></div>}
      {ribbon && <div className="st-ribbon">{ribbon}</div>}

      <div className={`st-scroll${swipe ? " swipe" : ""}`} ref={scroller} aria-hidden={phase !== "open"}>
        {phase === "open" &&
          numbered.map(({ c, num }, k) => {
            const View = CHAPTERS[c.type] as (p: { chapter: Chapter; ctx: StoryContext; num: number | null }) => ReactNode;
            return (
              <ChapterBoundary key={k}>
                <View chapter={c} ctx={ctx} num={num} />
                {!swipe && (k < numbered.length - 1 || protect?.locked) && c.type !== "hero" && <div className="st-divider" aria-hidden="true" />}
              </ChapterBoundary>
            );
          })}
        {phase === "open" && protect?.locked && (
          <section className="st-sec st-locked">
            <div className="st-wrap center">
              <div className="st-lock-card">
                <span className="st-lock-icon" aria-hidden="true"><Obj name="locked" size={60} /></span>
                <p className="st-eyebrow">The best part is locked</p>
                <h2 className="st-h2">The letter and the grand finale</h2>
                <p className="st-lead center">They open in your own version, with your names, photos, song and words.</p>
                {protect.locked}
              </div>
            </div>
          </section>
        )}
      </div>

      {swipe && phase === "open" && pages > 1 && (
        <>
          <div className="st-bars" aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => <span key={i} className={i < page ? "seen" : i === page ? "now" : ""} />)}
          </div>
          <nav className="st-pager" aria-label="Chapters">
            <button onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous chapter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <span>{page + 1} / {pages}</span>
            <button onClick={() => go(page + 1)} disabled={page >= pages - 1} aria-label="Next chapter" className={page === 0 ? "hint" : ""}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </nav>
        </>
      )}

      {protect && <div className="st-wm" aria-hidden="true" style={{ backgroundImage: watermarkTile(protect.watermark) }} />}

      {story.skin && <div className="st-skin front" aria-hidden="true"><span className="f1" /><span className="f2" /><span className="f3" /><span className="f4" /></div>}

      {phase !== "open" && <Opener story={story} ctx={ctx} opening={phase === "opening"} onOpen={open} />}

      {phase === "open" && music && (
        <button
          className={`st-music${playing ? " on" : ""}`}
          aria-label={playing ? "Pause music" : "Play music"}
          onClick={() => {
            if (isPlaying()) { stopAudio(); setPlaying(false); } else startMusic();
          }}
        >
          {playing ? (
            <span className="st-eq" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          )}
        </button>
      )}

      <div className={`st-toast${toastOn ? " on" : ""}`} role="status" aria-live="polite">
        <Motif kind={story.motif} fill={theme.accent} size={26} />
        <span>{toastMsg}</span>
      </div>

      <div className="st-confetti" aria-hidden="true">
        {confetti.map((p) => (
          <span key={p.id} style={{ left: `${p.l}%`, width: p.w, height: p.h, background: p.c, animationDuration: `${p.d}s`, animationDelay: `${p.dl}s` }} />
        ))}
      </div>
    </div>
  );
}

function Ambient({ story, reduce }: { story: Story; reduce: boolean }) {
  const parts = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: story.ambient.particles === "none" ? 0 : 18 }, (_, i) => ({
      i, l: r() * 100, z: 6 + r() * 12, d: 14 + r() * 16, dl: -r() * 30, sw: 3 + r() * 4, c: story.ambient.colors[i % story.ambient.colors.length],
    }));
  }, [story]);
  if (reduce) return <div className="st-ambient" aria-hidden="true" />;
  return (
    <div className="st-ambient" aria-hidden="true">
      {story.ambient.orbs.map((c, i) => (
        <div key={i} className={`st-orbw o${i + 1}`}><div className="st-orb" style={{ background: c }} /></div>
      ))}
      {parts.map((p) => (
        <span key={p.i} className={`st-p st-p-${story.ambient.particles}`} style={{ left: `${p.l}%`, animationDuration: `${p.d}s`, animationDelay: `${p.dl}s` }}>
          <span style={{ width: p.z, height: p.z, background: p.c, color: p.c, animationDuration: `${p.sw}s` }} />
        </span>
      ))}
    </div>
  );
}

const OPENER_OBJECT: Record<string, ObjName> = { gift: "wrapped_gift", chest: "package", ringbox: "ring" };

function Opener({ story, ctx, opening, onOpen }: { story: Story; ctx: StoryContext; opening: boolean; onOpen(): void }) {
  const stars = useMemo(() => {
    const r = seeded(3);
    return Array.from({ length: 40 }, (_, i) => ({ i, l: r() * 100, t: r() * 100, z: 1 + r() * 2.4, d: 1.5 + r() * 3, dl: -r() * 4 }));
  }, []);
  const { opener } = story;
  return (
    <section className={`st-intro${opening ? " out" : ""}`}>
      {stars.map((s) => (
        <span key={s.i} className="st-star" style={{ left: `${s.l}%`, top: `${s.t}%`, width: s.z, height: s.z, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` }} />
      ))}
      <p className="st-eyebrow">{ctx.fill(opener.eyebrow)}</p>
      <button className={`st-opener st-${opener.kind}${opening ? " opening" : ""}`} onClick={onOpen} aria-label={ctx.fill(opener.hint)}>
        <span className="o3d">
          <Obj name={OPENER_OBJECT[opener.kind] ?? (isRomantic(story.motif) ? "love_letter" : "envelope")} size={230} />
        </span>
      </button>
      <p className="st-hint">{ctx.fill(opener.hint)}</p>
      <p className="st-sub">{ctx.fill(opener.sub)}</p>
    </section>
  );
}

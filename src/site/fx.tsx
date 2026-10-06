"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "", style }: { children: ReactNode; delay?: number; as?: "div" | "section" | "li" | "article"; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || !("IntersectionObserver" in window)) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`rv${shown ? " in" : ""} ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Tilts a card toward the pointer and moves a soft light under it. Mouse and pen only. */
export function Tilt({ children, className = "", max = 7, style }: { children: ReactNode; className?: string; max?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch" || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * max}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}

/** A light that follows the pointer across a whole section. */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`spot ${className}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/** Cycles through words with a soft vertical flip. */
export function RotatingWord({ words, every = 2200 }: { words: string[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), every);
    return () => clearInterval(t);
  }, [words.length, every]);
  return (
    <span className="rot" aria-live="off">
      {/* The longest word reserves the width so the line never jumps. */}
      <span className="rot-sizer" aria-hidden="true">{words.reduce((a, b) => (b.length > a.length ? b : a))}</span>
      {words.map((w, k) => (
        <span key={w} className={`rot-w${k === i ? " on" : k === (i + words.length - 1) % words.length ? " out" : ""}`} aria-hidden={k !== i}>{w}</span>
      ))}
    </span>
  );
}

/** Counts up to a number when it comes into view. */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { setN(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

/** Shows a short burst of confetti from wherever the button was pressed. */
export function burst(x: number, y: number, colors = ["#ff6b9a", "#ffc861", "#8b7bff", "#4fd1c5", "#fff"]) {
  if (reduced()) return;
  const host = document.createElement("div");
  host.className = "burst";
  host.style.left = `${x}px`;
  host.style.top = `${y}px`;
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("i");
    const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const d = 60 + Math.random() * 90;
    s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
    s.style.setProperty("--dy", `${Math.sin(a) * d - 40}px`);
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = `${Math.random() * 80}ms`;
    host.appendChild(s);
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 1100);
}

/** A link styled as a button that leans toward the pointer and bursts into confetti when pressed. */
export function MagicButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a
      ref={ref}
      href={href}
      className={`mbtn ${className}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType === "touch" || reduced()) return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = ""; }}
      onClick={(e) => burst(e.clientX, e.clientY)}
    >
      <span>{children}</span>
    </a>
  );
}

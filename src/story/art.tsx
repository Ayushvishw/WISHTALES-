import { Obj, type ObjName } from "./obj";
import type { CSSProperties } from "react";
import type { MOTIFS } from "@/lib/templates/schema";

export type MotifKind = (typeof MOTIFS)[number];

/** One small decorative object per template (hearts, stars, marigolds…), as a glossy 3D image. */
export function Motif({ kind, fill, size = 24, className, style }: { kind: MotifKind; fill: string; size?: number; className?: string; style?: CSSProperties }) {
  const choice = MOTIF_3D[kind] ?? MOTIF_3D.heart;
  const name = typeof choice === "function" ? choice(fill) : choice;
  return <Obj name={name} size={size} className={className} style={style} />;
}

const MOTIF_3D: Record<string, ObjName | ((fill: string) => ObjName)> = {
  heart: heartFor,
  pixel: heartFor,
  star: (f) => (variant(f, 2) ? "glowing_star" : "star"),
  sparkle: "sparkles",
  petal: (f) => { const h = hueOf(f); return h === null ? "cherry_blossom" : h < 20 || h > 330 ? "hibiscus" : h < 70 ? "blossom" : "cherry_blossom"; },
  bubble: "bubbles",
  marigold: (f) => { const h = hueOf(f); return h !== null && (h > 300 || h < 15) ? "hibiscus" : "sunflower"; },
  candy: (f) => (["candy", "lollipop", "doughnut", "candy"] as const)[variant(f, 4)],
  butterfly: "butterfly",
  shell: (f) => (variant(f, 2) ? "spiral_shell" : "tropical_fish"),
  note: (f) => (variant(f, 2) ? "musical_notes" : "musical_note"),
  ring: "ring",
  rose: "rose",
  moon: "crescent_moon",
  key: "old_key",
};

/** Love-themed templates get a love letter instead of a plain envelope. */
export function isRomantic(motif: string) {
  return ["heart", "rose", "ring", "petal", "key"].includes(motif);
}

/** The 3D heart closest in colour to a theme colour. */
export function heartFor(fill: string): ObjName {
  const h = hueOf(fill);
  if (h === null) return "white_heart";
  const hearts: [number, ObjName][] = [[0, "red_heart"], [30, "orange_heart"], [52, "yellow_heart"], [130, "green_heart"], [195, "light_blue_heart"], [222, "blue_heart"], [275, "purple_heart"], [325, "pink_heart"], [360, "red_heart"]];
  return hearts.reduce((a, b) => (Math.abs(b[0] - h) < Math.abs(a[0] - h) ? b : a))[1];
}

function variant(fill: string, n: number) {
  let x = 0;
  for (const c of fill) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x % n;
}

/** Hue of a #rgb/#rrggbb colour in degrees, or null for greys and anything else. */
export function hueOf(color: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.12) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const SHADOW = "drop-shadow(0 12px 16px rgba(0,0,0,.3))";

/** Things that float up the hero and can be popped: 3D balloons, lanterns, bubbles and hearts, tinted to the theme. */
export function Floater({ kind, color, w }: { kind: "balloons" | "bubbles" | "lanterns" | "hearts"; color: string; w: number }) {
  if (kind === "hearts") return <Obj name={heartFor(color)} size={w * 1.25} />;
  if (kind === "bubbles") return <Obj name="bubbles" size={w * 1.2} />;
  // The balloon and lantern images are red; turn them to the theme colour.
  const h = hueOf(color);
  const tint: CSSProperties | undefined = h === null ? { filter: `saturate(.15) brightness(1.35) ${SHADOW}` } : { filter: `hue-rotate(${Math.round(h - 355)}deg) ${SHADOW}` };
  return <Obj name={kind === "lanterns" ? "red_paper_lantern" : "balloon"} size={w * 1.55} style={tint} />;
}

/** Deterministic random numbers, so server and browser render the same decorations. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

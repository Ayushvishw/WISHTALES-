import type { CSSProperties } from "react";
import type { MOTIFS } from "@/lib/templates/schema";

export type MotifKind = (typeof MOTIFS)[number];

const HEART = "M12 21s-7.5-4.6-9.7-9.4C.8 8.1 2.9 4 6.8 4c2.2 0 3.8 1.2 5.2 3 1.4-1.8 3-3 5.2-3 3.9 0 6 4.1 4.5 7.6C19.5 16.4 12 21 12 21z";
const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z";
const SPARKLE = "M12 1c.8 6.2 3.8 9.2 10 10-6.2.8-9.2 3.8-10 10-.8-6.2-3.8-9.2-10-10 6.2-.8 9.2-3.8 10-10z";
const NOTE = "M9 18.5a3 3 0 1 1-2-2.8V4l12-2.5v13a3 3 0 1 1-2-2.8V5.2L9 6.9z";
const SHELL = "M12 3c-5.5 0-9.5 4.4-9.5 9.4 0 2 1 3.6 2.6 4.6L7 20.5h10l1.9-3.5c1.6-1 2.6-2.6 2.6-4.6C21.5 7.4 17.5 3 12 3z";
const PIXEL_HEART = [
  [1, 0], [2, 0], [4, 0], [5, 0],
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
  [2, 4], [3, 4], [4, 4],
  [3, 5],
];

/** One small decorative shape per template (hearts, stars, marigolds…), drawn in a 24×24 box. */
export function Motif({ kind, fill, size = 24, className, style }: { kind: MotifKind; fill: string; size?: number; className?: string; style?: CSSProperties }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", className, style, "aria-hidden": true } as const;
  switch (kind) {
    case "heart":
      return <svg {...p}><path d={HEART} fill={fill} /></svg>;
    case "star":
      return <svg {...p}><path d={STAR} fill={fill} /></svg>;
    case "sparkle":
      return <svg {...p}><path d={SPARKLE} fill={fill} /></svg>;
    case "note":
      return <svg {...p}><path d={NOTE} fill={fill} /></svg>;
    case "shell":
      return (
        <svg {...p}>
          <path d={SHELL} fill={fill} />
          <path d="M12 5v14M8 6.2l1.6 12.6M16 6.2l-1.6 12.6M5 9.5l3.6 9M19 9.5l-3.6 9" stroke="rgba(0,0,0,.18)" strokeWidth="1.1" fill="none" />
        </svg>
      );
    case "bubble":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" fill={fill} fillOpacity=".22" stroke={fill} strokeWidth="1.4" />
          <ellipse cx="8.5" cy="8" rx="2.6" ry="1.6" fill="#fff" opacity=".75" transform="rotate(-35 8.5 8)" />
        </svg>
      );
    case "pixel":
      return (
        <svg {...p} viewBox="-0.5 -1 8 8" shapeRendering="crispEdges">
          {PIXEL_HEART.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />)}
          <rect x="1" y="1" width="1" height="1" fill="#fff" opacity=".6" />
        </svg>
      );
    case "marigold":
      return (
        <svg {...p}>
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx="12" cy="5.2" rx="2.6" ry="4.6" fill={fill} transform={`rotate(${i * 30} 12 12)`} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={`i${i}`} cx="12" cy="8" rx="1.8" ry="3" fill={fill} style={{ filter: "brightness(.85)" }} transform={`rotate(${i * 45 + 22} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="2.6" fill="#7a3b00" opacity=".55" />
        </svg>
      );
    case "petal":
      return (
        <svg {...p}>
          {Array.from({ length: 5 }, (_, i) => (
            <ellipse key={i} cx="12" cy="6.5" rx="3.6" ry="5.4" fill={fill} transform={`rotate(${i * 72} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="2.8" fill="#fff6d8" />
        </svg>
      );
    case "candy":
      return (
        <svg {...p}>
          <path d="M6.5 12 1.5 7.5v9zM17.5 12l5-4.5v9z" fill={fill} opacity=".85" />
          <circle cx="12" cy="12" r="6.2" fill={fill} />
          <path d="M8 9.5c2.5 1 5.5 1 8 0M7.6 13c2.8 1.2 6 1.2 8.8 0" stroke="#fff" strokeWidth="1.3" fill="none" opacity=".8" />
        </svg>
      );
    case "butterfly":
      return (
        <svg {...p}>
          <ellipse cx="7" cy="8.5" rx="5" ry="5.6" fill={fill} transform="rotate(-20 7 8.5)" />
          <ellipse cx="17" cy="8.5" rx="5" ry="5.6" fill={fill} transform="rotate(20 17 8.5)" />
          <ellipse cx="8" cy="16.5" rx="3.4" ry="4" fill={fill} opacity=".8" transform="rotate(25 8 16.5)" />
          <ellipse cx="16" cy="16.5" rx="3.4" ry="4" fill={fill} opacity=".8" transform="rotate(-25 16 16.5)" />
          <rect x="11.3" y="5" width="1.4" height="15" rx=".7" fill="#3a2a2a" />
        </svg>
      );
  }
}

/** Things that float up the hero and can be popped. */
export function Floater({ kind, color, w }: { kind: "balloons" | "bubbles" | "lanterns"; color: string; w: number }) {
  if (kind === "bubbles") {
    return (
      <svg width={w} height={w} viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="36" fill={color} fillOpacity=".16" stroke={color} strokeOpacity=".85" strokeWidth="2" />
        <ellipse cx="27" cy="25" rx="10" ry="6" fill="#fff" opacity=".6" transform="rotate(-35 27 25)" />
        <circle cx="56" cy="58" r="3" fill="#fff" opacity=".35" />
      </svg>
    );
  }
  if (kind === "lanterns") {
    return (
      <svg width={w} height={w * 1.5} viewBox="0 0 80 120" aria-hidden="true">
        <rect x="30" y="4" width="20" height="8" rx="2" fill="#3a2410" />
        <path d="M14 22c0-6 8-10 26-10s26 4 26 10v62c0 6-8 10-26 10s-26-4-26-10z" fill={color} />
        <path d="M28 14c-4 20-4 60 0 78M52 14c4 20 4 60 0 78M40 12v82" stroke="rgba(0,0,0,.18)" strokeWidth="2" fill="none" />
        <ellipse cx="40" cy="58" rx="16" ry="22" fill="#fff3c4" opacity=".45" />
        <rect x="30" y="94" width="20" height="8" rx="2" fill="#3a2410" />
        <path d="M34 102v12M40 102v16M46 102v12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={w} height={w * 1.75} viewBox="0 0 80 140" aria-hidden="true">
      <path d="M40 4C18 4 6 22 6 42c0 24 20 42 34 50 14-8 34-26 34-50C74 22 62 4 40 4z" fill={color} />
      <ellipse cx="27" cy="28" rx="7" ry="13" fill="#fff" opacity=".35" transform="rotate(-25 27 28)" />
      <path d="M35 92h10l-5 7z" fill={color} />
      <path d="M40 99c-6 11 6 21 0 39" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.5" fill="none" />
    </svg>
  );
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

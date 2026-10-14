import type { FunctionKind } from "@/lib/functions";

/**
 * Showpiece effects for the video designs: the animated picture for each wedding
 * function, scene transitions, gold dust, the date's sunburst and the finale
 * fireworks. Everything is a pure function of time, so the live preview and the
 * exported file match exactly.
 */

type Ctx = CanvasRenderingContext2D;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const rnd = (i: number, k = 0) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------------- per-function look ---------------- */

export type FunctionLook = { tint: string; particles: "petals" | "marigold" | "sparkles" | "bokeh" | "confetti" | "hearts" | "stars" | "lanterns" };

export const FUNCTION_LOOK: Record<FunctionKind, FunctionLook> = {
  roka: { tint: "#d9a84e", particles: "sparkles" },
  engagement: { tint: "#e7a1a9", particles: "hearts" },
  ganesh: { tint: "#e8913a", particles: "marigold" },
  mehendi: { tint: "#5f9a3d", particles: "petals" },
  haldi: { tint: "#f2b81d", particles: "marigold" },
  sangeet: { tint: "#c2379b", particles: "sparkles" },
  cocktail: { tint: "#6a5acd", particles: "bokeh" },
  baraat: { tint: "#e8742a", particles: "confetti" },
  wedding: { tint: "#c4303a", particles: "sparkles" },
  reception: { tint: "#d9a84e", particles: "bokeh" },
  custom: { tint: "#d9a84e", particles: "stars" },
};

/** A coloured glow behind a function's picture, so each function has its own mood. */
export function functionGlow(ctx: Ctx, W: number, cx: number, cy: number, kind: FunctionKind, a: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 380);
  g.addColorStop(0, rgba(FUNCTION_LOOK[kind].tint, 0.38 * a));
  g.addColorStop(1, rgba(FUNCTION_LOOK[kind].tint, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - 380, W, 760);
}

/* ---------------- function motifs ---------------- */

function petal(ctx: Ctx, len: number, wid: number) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.7, -len * 0.85, 0, -len);
  ctx.bezierCurveTo(-wid * 0.7, -len * 0.85, -wid, -len * 0.3, 0, 0);
}

function flame(ctx: Ctx, x: number, y: number, w: number, h: number, sway: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + w, y - h * 0.25, x + w * 0.55 + sway, y - h * 0.65, x + sway * 1.6, y - h);
  ctx.bezierCurveTo(x - w * 0.55 + sway, y - h * 0.65, x - w, y - h * 0.25, x, y);
  ctx.closePath();
}

function ring(ctx: Ctx, cx: number, cy: number, r: number, color: string, lw: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function spark(ctx: Ctx, x: number, y: number, r: number, a: number, color = "#fff6dc") {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

/** Animated picture for a wedding function. `s` is its radius in pixels, `lt` seconds since the screen began. */
export function functionMotif(ctx: Ctx, kind: FunctionKind, cx: number, cy: number, s: number, lt: number, a: number, gold: string, light: string) {
  if (a <= 0) return;
  const grow = ease(lt / 1.1);
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.translate(cx, cy);
  ctx.scale(0.75 + 0.25 * grow, 0.75 + 0.25 * grow);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // A fine gold ring that draws itself around every picture.
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ease(lt / 1.6));
  ctx.strokeStyle = rgba(gold, 0.85);
  ctx.lineWidth = 2;
  ctx.stroke();
  ring(ctx, 0, 0, s * 1.36, rgba(gold, 0.28), 1);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * Math.PI * 2 + lt * 0.25;
    ctx.fillStyle = rgba(light, 0.35 + 0.35 * Math.sin(lt * 2 + i));
    ctx.beginPath();
    ctx.arc(Math.cos(an) * s * 1.36, Math.sin(an) * s * 1.36, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (kind) {
    case "mehendi": {
      // A henna mandala that blooms ring by ring.
      ctx.rotate(lt * 0.12);
      for (let k = 0; k < 4; k++) {
        const p = ease((lt - 0.2 - k * 0.35) / 0.9);
        if (p <= 0) continue;
        const n = 8 + k * 4;
        const r = s * (0.28 + k * 0.24) * p;
        ctx.strokeStyle = rgba(k % 2 ? light : "#8fcf6a", 0.95);
        ctx.fillStyle = rgba("#8fcf6a", 0.9);
        ctx.lineWidth = 2.4;
        for (let i = 0; i < n; i++) {
          ctx.save();
          ctx.rotate((i / n) * Math.PI * 2 + k * 0.2);
          ctx.translate(0, -r);
          petal(ctx, s * 0.22, s * 0.075);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -s * 0.27, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (k < 3) ring(ctx, 0, 0, r + s * 0.04, rgba("#8fcf6a", 0.4), 1.2);
      }
      ctx.fillStyle = rgba(light, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "haldi": {
      // A marigold with petals that open and drift.
      for (let layer = 0; layer < 3; layer++) {
        const n = 14 - layer * 3;
        const p = ease((lt - layer * 0.25) / 0.9);
        for (let i = 0; i < n; i++) {
          ctx.save();
          ctx.rotate((i / n) * Math.PI * 2 + layer * 0.3 + Math.sin(lt * 0.8 + i) * 0.02);
          ctx.scale(1, p);
          petal(ctx, s * (0.95 - layer * 0.22), s * (0.2 - layer * 0.03));
          ctx.fillStyle = layer === 0 ? "#f0a10f" : layer === 1 ? "#f7bb1c" : "#ffd95a";
          ctx.fill();
          ctx.strokeStyle = "rgba(120,60,0,.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.fillStyle = "#c0620a";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "sangeet": {
      // Music notes that bob to a beat, with sound waves rippling out.
      for (let i = 0; i < 3; i++) {
        const ph = (lt * 0.9 + i / 3) % 1;
        ring(ctx, 0, 0, s * (0.35 + ph * 0.85), `rgba(255,210,240,${0.5 * (1 - ph)})`, 2);
      }
      const bob = Math.sin(lt * 5.2) * 6;
      ctx.fillStyle = light;
      ctx.strokeStyle = light;
      ctx.lineWidth = 7;
      for (const [x, y] of [[-s * 0.3, s * 0.3 + bob], [s * 0.26, s * 0.18 - bob]] as const) {
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.17, s * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.15, y - 4);
        ctx.lineTo(x + s * 0.15, y - s * 0.75);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, s * 0.3 + bob - s * 0.75 + 4);
      ctx.lineTo(s * 0.41, s * 0.18 - bob - s * 0.75 + 4);
      ctx.lineWidth = 14;
      ctx.stroke();
      break;
    }
    case "cocktail": {
      // Two glasses that tip together and clink with a flash of sparkle.
      const clink = Math.pow(Math.max(0, Math.sin(lt * 2.6)), 2);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * (s * 0.62 - clink * s * 0.22), s * 0.5);
        ctx.rotate(-side * (0.12 + clink * 0.2));
        ctx.strokeStyle = light;
        ctx.fillStyle = rgba(light, 0.22);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.85);
        ctx.lineTo(s * 0.3, -s * 0.85);
        ctx.quadraticCurveTo(s * 0.28, -s * 0.28, 0, -s * 0.22);
        ctx.quadraticCurveTo(-s * 0.28, -s * 0.28, -s * 0.3, -s * 0.85);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.22);
        ctx.lineTo(0, s * 0.18);
        ctx.moveTo(-s * 0.2, s * 0.18);
        ctx.lineTo(s * 0.2, s * 0.18);
        ctx.stroke();
        ctx.fillStyle = rgba(gold, 0.55);
        ctx.beginPath();
        ctx.moveTo(-s * 0.26, -s * 0.66);
        ctx.lineTo(s * 0.26, -s * 0.66);
        ctx.quadraticCurveTo(s * 0.2, -s * 0.34, 0, -s * 0.3);
        ctx.quadraticCurveTo(-s * 0.2, -s * 0.34, -s * 0.26, -s * 0.66);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 7; i++) {
        const ph = (lt * 0.5 + rnd(i)) % 1;
        spark(ctx, (rnd(i, 3) - 0.5) * s * 0.6, -s * 0.2 - ph * s * 0.9, 3 + rnd(i, 5) * 3, Math.sin(ph * Math.PI) * 0.9);
      }
      spark(ctx, 0, -s * 0.5, 12 + clink * 22, clink, "#ffffff");
      break;
    }
    case "baraat": {
      // A dhol, beaten in time, with rings of sound.
      const beat = Math.abs(Math.sin(lt * 5));
      for (let i = 0; i < 2; i++) {
        const ph = (lt * 2.5 + i / 2) % 1;
        ring(ctx, 0, 0, s * (0.6 + ph * 0.7), `rgba(255,190,110,${0.5 * (1 - ph)})`, 3);
      }
      ctx.fillStyle = "#8a3a14";
      ctx.strokeStyle = gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.38);
      ctx.quadraticCurveTo(0, -s * 0.5, s * 0.55, -s * 0.38);
      ctx.lineTo(s * 0.55, s * 0.38);
      ctx.quadraticCurveTo(0, s * 0.5, -s * 0.55, s * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const x of [-s * 0.55, s * 0.55]) {
        ctx.fillStyle = "#f0d9a8";
        ctx.beginPath();
        ctx.ellipse(x, 0, s * 0.1 * (1 + beat * 0.12), s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(gold, 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const x = -s * 0.5 + (i / 8) * s;
        ctx.lineTo(x, i % 2 ? -s * 0.34 : s * 0.34);
      }
      ctx.stroke();
      // Two sticks
      ctx.strokeStyle = light;
      ctx.lineWidth = 7;
      for (const side of [-1, 1]) {
        const sw = Math.sin(lt * 5 + (side > 0 ? 0 : Math.PI)) * 0.35;
        ctx.save();
        ctx.translate(side * s * 0.25, -s * 0.5);
        ctx.rotate(side * (0.7 - sw));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s * 0.6);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "wedding": {
      // The sacred fire of the pheras, flickering, with sparks rising.
      ctx.strokeStyle = "#5a2d12";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.62); ctx.lineTo(s * 0.5, s * 0.5);
      ctx.moveTo(-s * 0.5, s * 0.5); ctx.lineTo(s * 0.5, s * 0.62);
      ctx.stroke();
      const layers: [string, number, number][] = [["#e0301e", 0.62, 1.05], ["#f57a1c", 0.5, 0.85], ["#ffc23c", 0.36, 0.62], ["#fff2b0", 0.2, 0.36]];
      layers.forEach(([c, w, h], i) => {
        const sway = Math.sin(lt * (4 + i) + i) * s * 0.06;
        ctx.fillStyle = c;
        flame(ctx, 0, s * 0.55, s * w * 0.55, s * h * 1.15, sway);
        ctx.fill();
      });
      for (let i = 0; i < 9; i++) {
        const ph = (lt * 0.55 + rnd(i)) % 1;
        spark(ctx, (rnd(i, 2) - 0.5) * s * 0.9 + Math.sin(lt * 3 + i) * 10, s * 0.3 - ph * s * 1.5, 2.5 + rnd(i, 4) * 3, Math.sin(ph * Math.PI), "#ffd27a");
      }
      break;
    }
    case "ganesh": {
      // A lotus, opening petal by petal, with a diya's flame above it.
      for (let layer = 0; layer < 3; layer++) {
        const n = 5 + layer * 2;
        const p = ease((lt - layer * 0.3) / 0.9);
        for (let i = 0; i < n; i++) {
          const spread = (i / (n - 1) - 0.5) * (1.9 - layer * 0.2);
          ctx.save();
          ctx.translate(0, s * 0.45);
          ctx.rotate(spread * p);
          petal(ctx, s * (1.0 - layer * 0.16), s * 0.2);
          ctx.fillStyle = ["#f2a1b8", "#f7bccb", "#ffe0e8"][layer];
          ctx.fill();
          ctx.strokeStyle = "rgba(160,60,90,.4)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.fillStyle = "#ffc23c";
      flame(ctx, 0, s * 0.25, s * 0.09, s * 0.3, Math.sin(lt * 5) * 3);
      ctx.fill();
      break;
    }
    case "roka":
    case "engagement":
    case "reception": {
      // Two gold rings that slide together, with a diamond that catches the light.
      const join = ease((lt - 0.2) / 1.2);
      ctx.lineWidth = 12;
      for (const side of [-1, 1]) {
        ctx.strokeStyle = side < 0 ? gold : light;
        ctx.beginPath();
        ctx.arc(side * (s * 0.5 - join * s * 0.13), s * 0.2, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(0, -s * 0.34);
      ctx.fillStyle = "#e9f7ff";
      ctx.strokeStyle = "#9fd4f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.05); ctx.lineTo(-s * 0.1, -s * 0.2); ctx.lineTo(s * 0.1, -s * 0.2); ctx.lineTo(s * 0.2, -s * 0.05); ctx.lineTo(0, s * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      const g = (lt * 0.6) % 1.6;
      spark(ctx, -s * 0.05, -s * 0.52, 8 + 14 * Math.sin(clamp(g) * Math.PI), Math.sin(clamp(g) * Math.PI), "#ffffff");
      break;
    }
    default: {
      // Any other function: a gold lotus-diamond that turns slowly.
      ctx.rotate(lt * 0.2);
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i / 8) * Math.PI * 2);
        petal(ctx, s * 0.95, s * 0.2);
        ctx.fillStyle = rgba(gold, 0.18);
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.22); ctx.lineTo(s * 0.16, 0); ctx.lineTo(0, s * 0.22); ctx.lineTo(-s * 0.16, 0);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ---------------- scene transitions ---------------- */

export type Transition = "doors" | "iris" | "sweep" | "shutter" | "petals";

/** Which transition a design uses between scenes. */
export function transitionFor(ornament: string): Transition {
  return ({ arch: "doors", toran: "iris", mandala: "iris", deco: "sweep", frame: "shutter", stars: "sweep", floral: "petals", minimal: "sweep" } as Record<string, Transition>)[ornament] ?? "sweep";
}

/**
 * Draws over the first moments of a scene so it appears to open onto the picture
 * (p goes 0→1). The covers use the background colours, so nothing flashes.
 */
export function transition(ctx: Ctx, kind: Transition, p: number, W: number, H: number, sky: [string, string], gold: string, accent: string) {
  if (p >= 1 || p < 0) return;
  const e = smooth(p);
  const cover = ctx.createLinearGradient(0, 0, 0, H);
  cover.addColorStop(0, sky[0]);
  cover.addColorStop(1, sky[1]);
  ctx.save();
  switch (kind) {
    case "doors": {
      // Two carved doors swing apart with a thread of gold between them.
      const w = (W / 2) * (1 - e);
      ctx.fillStyle = cover;
      ctx.fillRect(0, 0, w, H);
      ctx.fillRect(W - w, 0, w, H);
      ctx.strokeStyle = rgba(gold, 0.9 * (1 - p));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w, 0); ctx.lineTo(w, H);
      ctx.moveTo(W - w, 0); ctx.lineTo(W - w, H);
      ctx.stroke();
      const glow = ctx.createLinearGradient(w - 40, 0, w + 40, 0);
      glow.addColorStop(0, rgba(gold, 0));
      glow.addColorStop(0.5, rgba(gold, 0.35 * (1 - p)));
      glow.addColorStop(1, rgba(gold, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(w - 40, 0, 80, H);
      ctx.fillRect(W - w - 40, 0, 80, H);
      break;
    }
    case "iris": {
      // A circle of light opens from the middle.
      const r = e * Math.hypot(W, H) * 0.62;
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H * 0.46, r, 0, Math.PI * 2, true);
      ctx.fillStyle = cover;
      ctx.fill("evenodd");
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.46, r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(gold, 0.85 * (1 - p));
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
    case "shutter": {
      // Blinds that lift one after another.
      const n = 8;
      ctx.fillStyle = cover;
      for (let i = 0; i < n; i++) {
        const q = smooth((p * 1.6 - (i / n) * 0.6));
        const h = (H / n) * (1 - q);
        ctx.fillRect(0, (H / n) * i, W, h);
        if (h > 2) {
          ctx.fillStyle = rgba(gold, 0.7 * (1 - p));
          ctx.fillRect(0, (H / n) * i + h - 2, W, 2);
          ctx.fillStyle = cover;
        }
      }
      break;
    }
    case "petals": {
      // A wave of petals sweeps over, uncovering the scene behind it.
      const x = -200 + e * (W + 500);
      ctx.fillStyle = cover;
      ctx.fillRect(x, 0, W, H);
      for (let i = 0; i < 26; i++) {
        const y = rnd(i, 1) * H;
        const px = x - rnd(i, 2) * 260 + Math.sin(p * 6 + i) * 20;
        ctx.save();
        ctx.translate(px, y);
        ctx.rotate(rnd(i, 3) * 6 + p * 5);
        ctx.globalAlpha = 0.85 * (1 - p);
        petal(ctx, 34 + rnd(i, 4) * 26, 12);
        ctx.fillStyle = accent;
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    default: {
      // A band of light sweeps across, wiping the cover away.
      const x = e * (W + 500) - 250;
      ctx.fillStyle = cover;
      ctx.fillRect(x + 250, 0, W, H);
      const g = ctx.createLinearGradient(x - 120, 0, x + 260, 0);
      g.addColorStop(0, rgba(gold, 0));
      g.addColorStop(0.7, rgba(gold, 0.55 * (1 - p)));
      g.addColorStop(1, rgba(gold, 0));
      ctx.save();
      ctx.transform(1, 0, -0.35, 1, 0, 0);
      ctx.fillStyle = g;
      ctx.fillRect(x - 120, 0, 380, H);
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ---------------- ambient + showpieces ---------------- */

/** Fine gold dust that always drifts upward, so even a quiet screen is alive. */
export function goldDust(ctx: Ctx, t: number, W: number, H: number, color: string) {
  ctx.save();
  for (let i = 0; i < 46; i++) {
    const sp = 0.012 + rnd(i, 1) * 0.02;
    const y = H - (((t * sp * 60 + rnd(i, 2) * H) % (H + 40)));
    const x = rnd(i, 3) * W + Math.sin(t * 0.6 + i) * 14;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + rnd(i, 4)) + i));
    ctx.fillStyle = rgba(color, 0.55 * tw);
    ctx.beginPath();
    ctx.arc(x, y, 0.9 + rnd(i, 5) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Slowly turning rays and rings behind the date. */
export function sunburst(ctx: Ctx, cx: number, cy: number, r: number, t: number, color: string, a: number) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = clamp(a);
  ctx.rotate(t * 0.08);
  const n = 28;
  for (let i = 0; i < n; i++) {
    ctx.rotate((Math.PI * 2) / n);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-7, -r);
    ctx.lineTo(7, -r);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, -r);
    g.addColorStop(0, rgba(color, i % 2 ? 0.1 : 0.2));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = clamp(a) * 0.6;
  ring(ctx, cx, cy, r * 0.5, rgba(color, 0.5), 1.2);
  ring(ctx, cx, cy, r * 0.56, rgba(color, 0.25), 1);
  ctx.restore();
}

/** Bursts of light for the very last screen. */
export function fireworks(ctx: Ctx, lt: number, W: number, H: number, colors: string[]) {
  const spots: [number, number, number][] = [[0.25, 0.22, 0.2], [0.76, 0.18, 0.9], [0.5, 0.3, 1.6], [0.18, 0.42, 2.3], [0.84, 0.38, 2.9]];
  ctx.save();
  ctx.lineCap = "round";
  spots.forEach(([fx, fy, start], k) => {
    const q = (lt - start) / 1.8;
    if (q < 0 || q > 1) return;
    const color = colors[k % colors.length];
    const e = ease(q);
    const n = 22;
    for (let i = 0; i < n; i++) {
      const an = (i / n) * Math.PI * 2 + k;
      const rr = (60 + rnd(i, k) * 70) * e;
      const x = fx * W + Math.cos(an) * rr;
      const y = fy * H + Math.sin(an) * rr + q * q * 50;
      const tail = 14 * (1 - q);
      ctx.strokeStyle = rgba(color, (1 - q) * 0.95);
      ctx.lineWidth = 3 * (1 - q) + 0.8;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(an) * tail, y - Math.sin(an) * tail);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    spark(ctx, fx * W, fy * H, 16 * (1 - q), (1 - q) * 1.2, "#ffffff");
  });
  ctx.restore();
}

/** A pair of curling flourishes either side of a point, for the "&". */
export function flourish(ctx: Ctx, cx: number, cy: number, gap: number, a: number, color: string) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    const x0 = cx + side * gap;
    const len = 110 * ease(a);
    ctx.beginPath();
    ctx.moveTo(x0, cy);
    ctx.bezierCurveTo(x0 + side * len * 0.4, cy - 16, x0 + side * len * 0.7, cy + 16, x0 + side * len, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x0 + side * (len + 8), cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

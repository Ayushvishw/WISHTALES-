import { fillText, type Values } from "@/lib/personalization";
import type { TemplateConfig, Theme, VideoDesign } from "@/lib/templates/schema";
import { functionShows, type FunctionShow } from "@/lib/functions";
import { FUNCTION_LOOK, fireworks, flourish, functionGlow, functionMotif, goldDust, sunburst, transition, transitionFor } from "./fx";
import { dateParts, shortDate, shotAt, VIDEO_H as H, VIDEO_W as W, type Shot, type Timeline } from "./timeline";

/**
 * Draws one frame of a video invitation at time t. The same function feeds the
 * live preview and the downloaded file, so what the customer sees is exactly
 * what they get. Everything is drawn in a 720×1280 space.
 */

export type Img = CanvasImageSource;

function size(img: Img): [number, number] {
  if (img instanceof HTMLVideoElement) return [img.videoWidth, img.videoHeight];
  if (img instanceof HTMLImageElement) return [img.naturalWidth, img.naturalHeight];
  const s = img as { width: number | SVGAnimatedLength; height: number | SVGAnimatedLength };
  return [Number(s.width), Number(s.height)];
}
export type Assets = {
  photos: (Img | null)[];
  art: Partial<Record<string, Img>>;
  /** The current frame of a background clip, already positioned at this scene's time by the caller. */
  clip?(name: string): Img | null;
};
export type Frame = { config: TemplateConfig; values: Values; timeline: Timeline; assets: Assets; watermark?: string };
type Ctx = CanvasRenderingContext2D;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const smooth = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const rnd = (i: number, k = 0) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** The time being drawn, for effects (shimmer, pen sparkle) that text helpers need. */
let NOW = 0;

export function drawFrame(ctx: Ctx, t: number, f: Frame) {
  NOW = t;
  const th = f.config.theme;
  const v = f.config.video!;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
  background(ctx, t, th, v);
  const shot = shotAt(f.timeline, t);
  const footage = shot?.scene.clip ? f.assets.clip?.(shot.scene.clip) : null;
  if (shot && footage) clipLayer(ctx, t, shot, footage);
  else ornamentBack(ctx, t, th, v);
  if (shot) {
    // A very slow push-in keeps still screens feeling like film.
    const lt = t - shot.start;
    const push = 1 + 0.03 * (lt / shot.dur);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);
    scene(ctx, t, shot, f);
    ctx.restore();
    if (shot.scene.kind === "closing") fireworks(ctx, lt, W, H, [th.accent, th.accent3 ?? th.accent, th.accent2]);
  }
  const fn = shot?.scene.kind === "events" && shot.item !== undefined ? functionShows(f.values, v.lang ?? "en")[shot.item] : null;
  particles(ctx, t, th, fn ? { ...v, particles: FUNCTION_LOOK[fn.kind].particles } : v);
  goldDust(ctx, t, W, H, th.accent3 ?? th.accent);
  // The frame draws itself in over the opening seconds.
  const intro = ease(t / 2.4);
  ctx.save();
  ctx.globalAlpha = intro;
  const zoom = 1.04 - 0.04 * intro;
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
  ornamentFront(ctx, t, th, v);
  ctx.restore();
  if (shot && shot !== f.timeline.shots[0]) {
    transition(ctx, transitionFor(v.ornament), (t - shot.start) / 0.8, W, H, v.sky, th.accent, th.accent2);
  }
  // Open from dark and settle back at the end, so the video starts and loops softly.
  const edge = Math.max(1 - t / 0.9, (t - (f.timeline.duration - 0.8)) / 0.8);
  if (edge > 0) {
    ctx.globalAlpha = clamp(edge);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }
  if (f.watermark) watermark(ctx, t, f.watermark);
  ctx.restore();
}

/** Where a scene's background clip should be at time t: it plays from the scene's start and loops. */
export function clipTime(shot: Shot, t: number, clipDuration: number) {
  const lt = Math.max(0, t - shot.start);
  return clipDuration > 0 ? lt % clipDuration : 0;
}

/* ---------------- background ---------------- */

/** Footage under the words, faded at the scene's edges, with a soft shade so text always reads. */
function clipLayer(ctx: Ctx, t: number, shot: Shot, img: Img) {
  const lt = t - shot.start;
  ctx.save();
  ctx.globalAlpha = Math.min(smooth(lt / 0.5), 1 - smooth((lt - (shot.dur - 0.45)) / 0.45));
  cover(ctx, img, 0, 0, W, H, 1);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,.35)");
  g.addColorStop(0.45, "rgba(0,0,0,.18)");
  g.addColorStop(1, "rgba(0,0,0,.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function background(ctx: Ctx, t: number, th: Theme, v: VideoDesign) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, v.sky[0]);
  g.addColorStop(1, v.sky[1]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = 520 + Math.sin(t * 0.6) * 40;
  const glow = ctx.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, r);
  glow.addColorStop(0, rgba(v.glow, 0.42));
  glow.addColorStop(1, rgba(v.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // A soft vignette keeps the eye in the middle.
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, `rgba(0,0,0,${isDark(th.bg) ? 0.45 : 0.12})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
}

/* ---------------- ornaments ---------------- */

function mandala(ctx: Ctx, cx: number, cy: number, r: number, rot: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.2, r / 160);
  for (const k of [1, 0.84, 0.62, 0.3]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  const petals = (n: number, r0: number, r1: number, wide: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -r0);
      ctx.bezierCurveTo(wide, -r0 - (r1 - r0) * 0.35, wide * 0.6, -r1 + 4, 0, -r1);
      ctx.bezierCurveTo(-wide * 0.6, -r1 + 4, -wide, -r0 - (r1 - r0) * 0.35, 0, -r0);
      ctx.stroke();
      ctx.restore();
    }
  };
  petals(12, r * 0.84, r * 1.12, r * 0.13);
  petals(16, r * 0.62, r * 0.84, r * 0.08);
  petals(10, r * 0.3, r * 0.62, r * 0.1);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93, r / 70, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function diamond(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
}

function ornamentBack(ctx: Ctx, t: number, th: Theme, v: VideoDesign) {
  const gold = th.accent;
  ctx.save();
  switch (v.ornament) {
    case "mandala":
      mandala(ctx, W / 2, H * 0.47, 400, t * 0.05, gold, 0.1);
      break;
    case "deco": {
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.09;
      for (let i = 0; i < 28; i++) {
        const a = Math.PI + (i / 27) * Math.PI;
        line(ctx, W / 2, H + 60, W / 2 + Math.cos(a) * 1500, H + 60 + Math.sin(a) * 1500);
      }
      break;
    }
    case "stars": {
      for (let i = 0; i < 110; i++) {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rnd(i, 3)) + i));
        ctx.globalAlpha = tw * 0.8;
        ctx.fillStyle = i % 9 === 0 ? th.accent3 ?? gold : "#ffffff";
        ctx.beginPath();
        ctx.arc(rnd(i, 1) * W, rnd(i, 2) * H, 0.6 + rnd(i, 4) * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Crescent moon
      ctx.globalAlpha = 0.9;
      const mg = ctx.createRadialGradient(570, 170, 10, 570, 170, 160);
      mg.addColorStop(0, rgba(th.accent3 ?? gold, 0.35));
      mg.addColorStop(1, rgba(th.accent3 ?? gold, 0));
      ctx.fillStyle = mg;
      ctx.fillRect(400, 0, 320, 340);
      ctx.fillStyle = th.accent3 ?? gold;
      ctx.beginPath();
      ctx.arc(570, 170, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(592, 154, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function flower(ctx: Ctx, x: number, y: number, r: number, rot: number, stroke: string, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.3, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function leaf(ctx: Ctx, x: number, y: number, len: number, rot: number, stroke: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0);
  ctx.stroke();
  line(ctx, 0, 0, len * 0.9, 0);
  ctx.restore();
}

function floralCorner(ctx: Ctx, t: number, th: Theme, flip: boolean) {
  ctx.save();
  if (flip) {
    ctx.translate(W, H);
    ctx.rotate(Math.PI);
  }
  const sway = Math.sin(t * 0.8) * 0.04;
  ctx.rotate(sway * 0.3);
  const stroke = th.accent;
  const fill = rgba(th.accent2, 0.35);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-10, 250);
  ctx.bezierCurveTo(60, 200, 120, 130, 250, 40);
  ctx.stroke();
  for (const [x, y, l, r] of [[30, 214, 46, -2.2], [74, 170, 50, -0.6], [120, 128, 44, -2.4], [168, 96, 48, -0.4], [214, 64, 40, -2.0]] as const) leaf(ctx, x, y, l, r + sway, stroke);
  flower(ctx, 70, 70, 54, t * 0.08, stroke, fill);
  flower(ctx, 158, 34, 30, -t * 0.1, stroke, fill);
  flower(ctx, 34, 160, 32, t * 0.12, stroke, fill);
  ctx.restore();
}

function archPath(ctx: Ctx, inset: number) {
  const l = inset, r = W - inset, b = H - inset, shoulder = 330 + inset, apex = 70 + inset;
  ctx.beginPath();
  ctx.moveTo(l, b);
  ctx.lineTo(l, shoulder);
  ctx.bezierCurveTo(l, shoulder - 150, W / 2 - 150, apex + 120, W / 2, apex);
  ctx.bezierCurveTo(W / 2 + 150, apex + 120, r, shoulder - 150, r, shoulder);
  ctx.lineTo(r, b);
  ctx.closePath();
}

function marigoldString(ctx: Ctx, pts: [number, number][], r: number) {
  const cols = ["#f39c12", "#f7c948", "#e8590c"];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    ctx.fillStyle = cols[i % 3];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function toran(ctx: Ctx, t: number) {
  const sway = Math.sin(t * 1.1) * 6;
  // Three swags across the top
  for (let s = 0; s < 3; s++) {
    const x0 = (s * W) / 3, x1 = ((s + 1) * W) / 3;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      pts.push([x0 + (x1 - x0) * u + Math.sin(u * Math.PI) * sway * 0.4, 6 + Math.sin(u * Math.PI) * (70 + sway)]);
    }
    marigoldString(ctx, pts, 10);
  }
  // Hanging strands with a mango leaf at each end
  for (let k = 0; k <= 3; k++) {
    const x = (k * W) / 3 + (k === 0 ? 14 : k === 3 ? -14 : 0);
    const len = k === 0 || k === 3 ? 18 : 12;
    const pts: [number, number][] = Array.from({ length: len }, (_, i) => [x + Math.sin(t * 1.3 + k + i * 0.08) * i * 0.6, 10 + i * 19] as [number, number]);
    marigoldString(ctx, pts, 9);
    const [lx, ly] = pts[pts.length - 1];
    ctx.save();
    ctx.translate(lx, ly + 8);
    ctx.rotate(Math.sin(t * 1.3 + k) * 0.15);
    ctx.fillStyle = "#3f7d3a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(14, 22, 0, 46);
    ctx.quadraticCurveTo(-14, 22, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

function ornamentFront(ctx: Ctx, t: number, th: Theme, v: VideoDesign) {
  const gold = th.accent;
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;
  switch (v.ornament) {
    case "mandala":
      mandala(ctx, W / 2, -30, 170, -t * 0.08, gold, 0.55);
      mandala(ctx, W / 2, H + 30, 170, t * 0.08, gold, 0.55);
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(26, 26, W - 52, H - 52);
      break;
    case "deco": {
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.lineWidth = 1;
      ctx.strokeRect(36, 36, W - 72, H - 72);
      for (const [x, y, sx, sy] of [[36, 36, 1, 1], [W - 36, 36, -1, 1], [36, H - 36, 1, -1], [W - 36, H - 36, -1, -1]] as const) {
        ctx.lineWidth = 1.5;
        for (const d of [18, 34, 50]) {
          ctx.beginPath();
          ctx.moveTo(x + sx * d, y);
          ctx.lineTo(x + sx * d, y + sy * d);
          ctx.lineTo(x, y + sy * d);
          ctx.stroke();
        }
      }
      // Fans at the top and bottom
      for (const [y, dir] of [[36, 1], [H - 36, -1]] as const) {
        for (let k = 1; k <= 4; k++) {
          ctx.beginPath();
          ctx.arc(W / 2, y, k * 16, dir > 0 ? 0 : Math.PI, dir > 0 ? Math.PI : Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case "floral":
      ctx.globalAlpha = 0.95;
      floralCorner(ctx, t, th, false);
      floralCorner(ctx, t, th, true);
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(30, 30, W - 60, H - 60);
      break;
    case "arch":
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.4;
      archPath(ctx, 34);
      ctx.stroke();
      ctx.lineWidth = 1;
      archPath(ctx, 48);
      ctx.stroke();
      // Little hanging lamps inside the arch
      for (const [x, len] of [[W / 2, 150], [W / 2 - 150, 110], [W / 2 + 150, 110]] as const) {
        const sw = Math.sin(t * 1.2 + x) * 3;
        ctx.globalAlpha = 0.8;
        line(ctx, x, x === W / 2 ? 120 : 200, x + sw, (x === W / 2 ? 120 : 200) + len - 70);
        const ly = (x === W / 2 ? 120 : 200) + len - 70;
        const lg = ctx.createRadialGradient(x + sw, ly + 14, 0, x + sw, ly + 14, 40);
        lg.addColorStop(0, rgba(th.accent3 ?? gold, 0.55));
        lg.addColorStop(1, rgba(th.accent3 ?? gold, 0));
        ctx.fillStyle = lg;
        ctx.fillRect(x + sw - 40, ly - 26, 80, 80);
        ctx.fillStyle = gold;
        diamond(ctx, x + sw, ly + 12, 10);
      }
      break;
    case "toran":
      toran(ctx, t);
      ctx.strokeStyle = gold;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(28, 28, W - 56, H - 56);
      break;
    case "frame": {
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(30, 30, W - 60, H - 60);
      ctx.lineWidth = 1;
      ctx.strokeRect(42, 42, W - 84, H - 84);
      for (const [x, y, sx, sy] of [[42, 42, 1, 1], [W - 42, 42, -1, 1], [42, H - 42, 1, -1], [W - 42, H - 42, -1, -1]] as const) {
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x + sx * 26, y + sy * 26, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + sx * 46, y + sy * 8);
        ctx.quadraticCurveTo(x + sx * 46, y + sy * 46, x + sx * 8, y + sy * 46);
        ctx.stroke();
        diamond(ctx, x + sx * 26, y + sy * 26, 4);
      }
      for (const [x, y] of [[W / 2, 42], [W / 2, H - 42], [42, H / 2], [W - 42, H / 2]] as const) diamond(ctx, x, y, 7);
      break;
    }
    case "stars":
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, W - 56, H - 56);
      break;
    case "minimal":
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(36, 36, W - 72, H - 72);
      for (const [x, y] of [[W / 2, 36], [W / 2, H - 36]] as const) diamond(ctx, x, y, 6);
      break;
  }
  ctx.restore();
}

/* ---------------- particles ---------------- */

function heart(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  ctx.fill();
}

function sparkle(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}

function particles(ctx: Ctx, t: number, th: Theme, v: VideoDesign) {
  const kind = v.particles;
  if (kind === "none") return;
  ctx.save();
  const fall = (i: number, speed: number, pad = 60) => {
    const y = ((rnd(i, 1) * (H + pad * 2) + t * speed * (0.6 + rnd(i, 2) * 0.8)) % (H + pad * 2)) - pad;
    const x = rnd(i, 3) * W + Math.sin(t * (0.5 + rnd(i, 4)) + i) * 30;
    return [x, y] as const;
  };
  const rise = (i: number, speed: number, pad = 60) => {
    const [x, y] = fall(i, speed, pad);
    return [x, H - y] as const;
  };
  switch (kind) {
    case "petals":
    case "marigold": {
      const cols = kind === "petals" ? [th.accent2, th.accent3 ?? th.accent2, th.accent2] : ["#f39c12", "#f7c948", "#e8590c"];
      for (let i = 0; i < 26; i++) {
        const [x, y] = fall(i, 55);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (0.6 + rnd(i, 5)) + i);
        ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 2 + i));
        ctx.globalAlpha = 0.78;
        ctx.fillStyle = cols[i % 3];
        ctx.beginPath();
        ctx.ellipse(0, 0, 7 + rnd(i, 6) * 6, 4 + rnd(i, 7) * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "sparkles":
    case "stars": {
      for (let i = 0; i < 34; i++) {
        const [x, y] = rise(i, 14);
        const tw = Math.pow(Math.abs(Math.sin(t * (0.8 + rnd(i, 5)) + i * 1.7)), 3);
        ctx.globalAlpha = 0.2 + tw * 0.8;
        ctx.fillStyle = i % 3 ? th.accent3 ?? th.accent : "#ffffff";
        if (kind === "sparkles") sparkle(ctx, x, y, 4 + tw * 8 * (0.5 + rnd(i, 6)));
        else {
          ctx.beginPath();
          ctx.arc(x, y, 1 + tw * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "bokeh": {
      for (let i = 0; i < 18; i++) {
        const [x, y] = rise(i, 18, 120);
        const r = 30 + rnd(i, 5) * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const c = [th.accent, th.accent2, th.accent3 ?? th.accent][i % 3];
        g.addColorStop(0, rgba(c, 0.22));
        g.addColorStop(0.7, rgba(c, 0.1));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      break;
    }
    case "confetti": {
      const cols = th.fx;
      for (let i = 0; i < 44; i++) {
        const [x, y] = fall(i, 80);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (1 + rnd(i, 5) * 2) + i);
        ctx.scale(Math.sin(t * 3 + i), 1);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(-5, -8, 10, 16);
        ctx.restore();
      }
      break;
    }
    case "hearts": {
      for (let i = 0; i < 16; i++) {
        const [x, y] = rise(i, 40);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = i % 2 ? th.accent2 : th.accent3 ?? th.accent;
        heart(ctx, x, y, 14 + rnd(i, 5) * 14);
      }
      break;
    }
    case "lanterns": {
      for (let i = 0; i < 11; i++) {
        const [x, y] = rise(i, 26, 100);
        const s = 0.6 + rnd(i, 5) * 0.7;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 60 * s);
        g.addColorStop(0, "rgba(255,190,90,.45)");
        g.addColorStop(1, "rgba(255,190,90,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 60 * s, y - 60 * s, 120 * s, 120 * s);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#ffb347";
        ctx.beginPath();
        ctx.moveTo(x - 12 * s, y - 18 * s);
        ctx.lineTo(x + 12 * s, y - 18 * s);
        ctx.lineTo(x + 9 * s, y + 16 * s);
        ctx.lineTo(x - 9 * s, y + 16 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff3c4";
        ctx.fillRect(x - 4 * s, y + 10 * s, 8 * s, 6 * s);
        ctx.globalAlpha = 1;
      }
      break;
    }
  }
  ctx.restore();
}

/* ---------------- text ---------------- */

type TextOpts = {
  family: string;
  size: number;
  color: string;
  weight?: number | string;
  italic?: boolean;
  maxW?: number;
  maxLines?: number;
  lineH?: number;
  spacing?: number;
  upper?: boolean;
  glow?: string;
  /** A highlight colour that glides across the words now and then. */
  shine?: string;
};

function setFont(ctx: Ctx, o: TextOpts, size: number) {
  ctx.font = `${o.italic ? "italic " : ""}${o.weight ?? 400} ${size}px ${o.family}`;
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${o.spacing ?? 0}px`;
}

function wrap(ctx: Ctx, str: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of str.split("\n")) {
    const ws = para.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const w of ws) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width > maxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** Lays out text centred at x, shrinking it until it fits. Returns the lines and their size. */
function layout(ctx: Ctx, raw: string, o: TextOpts) {
  const str = o.upper ? raw.toUpperCase() : raw;
  const maxW = o.maxW ?? W - 140;
  const maxLines = o.maxLines ?? 3;
  let size = o.size;
  let lines: string[] = [];
  for (; size >= o.size * 0.45; size -= 2) {
    setFont(ctx, o, size);
    lines = wrap(ctx, str, maxW);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
  }
  if (lines.length > maxLines) lines = [...lines.slice(0, maxLines - 1), `${lines.slice(maxLines - 1).join(" ").slice(0, 60)}…`];
  const lh = size * (o.lineH ?? 1.25);
  return { lines, size, lh, height: lines.length * lh };
}

/** Draws text whose first line's middle sits at y; alpha and rise come from the animation. */
function text(ctx: Ctx, raw: string, x: number, y: number, o: TextOpts, a = 1, reveal = 1) {
  if (!raw.trim() || a <= 0) return 0;
  const L = layout(ctx, raw, o);
  ctx.save();
  setFont(ctx, o, L.size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = o.color;
  const wide = Math.max(...L.lines.map((l) => ctx.measureText(l).width));
  if (o.shine) {
    const p = ((NOW * 0.32) % 2.2) - 0.6;
    const g = ctx.createLinearGradient(x - wide / 2, 0, x + wide / 2, 0);
    const stop = (v: number) => Math.min(1, Math.max(0, v));
    g.addColorStop(0, o.color);
    g.addColorStop(stop(p - 0.18), o.color);
    g.addColorStop(stop(p), o.shine);
    g.addColorStop(stop(p + 0.18), o.color);
    g.addColorStop(1, o.color);
    ctx.fillStyle = g;
  }
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = 18;
  }
  if (reveal < 1) {
    // A handwriting-like reveal: the words are uncovered left to right.
    const wMax = Math.max(...L.lines.map((l) => ctx.measureText(l).width)) + 40;
    ctx.beginPath();
    ctx.rect(x - wMax / 2, y - L.size, wMax * smooth(reveal), L.height + L.size);
    ctx.clip();
  }
  L.lines.forEach((l, i) => ctx.fillText(l, x, y + i * L.lh));
  ctx.restore();
  if (reveal > 0 && reveal < 1) {
    // The pen: a twinkle rides the edge of the handwriting as it appears.
    const wMax = wide + 40;
    const ex = x - wMax / 2 + wMax * smooth(reveal);
    ctx.save();
    ctx.globalAlpha = clamp(a) * 0.95;
    ctx.fillStyle = "#fff3d0";
    ctx.shadowColor = "#ffe6a0";
    ctx.shadowBlur = 14;
    sparkle(ctx, ex, y + (L.height - L.lh) / 2, 15 + 8 * Math.sin(NOW * 30));
    ctx.restore();
  }
  return L.height;
}

/* ---------------- scenes ---------------- */

function eyebrow(ctx: Ctx, th: Theme, str: string, y: number, a: number) {
  if (!str || a <= 0) return;
  const o: TextOpts = { family: th.body, size: 21, color: th.accent3 ?? th.accent, weight: 600, spacing: 6, upper: true, maxLines: 2, maxW: W - 200 };
  text(ctx, str, W / 2, y, o, a);
  ctx.save();
  setFont(ctx, o, 21);
  const w = Math.min(W - 200, ctx.measureText(str.toUpperCase()).width);
  ctx.globalAlpha = a * 0.8;
  ctx.strokeStyle = th.accent;
  ctx.fillStyle = th.accent;
  ctx.lineWidth = 1.2;
  const span = 46 * ease(a);
  line(ctx, W / 2 - w / 2 - 18 - span, y, W / 2 - w / 2 - 18, y);
  line(ctx, W / 2 + w / 2 + 18, y, W / 2 + w / 2 + 18 + span, y);
  diamond(ctx, W / 2 - w / 2 - 18 - span, y, 3.5);
  diamond(ctx, W / 2 + w / 2 + 18 + span, y, 3.5);
  ctx.restore();
}

function divider(ctx: Ctx, th: Theme, y: number, a: number, width = 220) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.strokeStyle = th.accent;
  ctx.fillStyle = th.accent;
  ctx.lineWidth = 1.4;
  const w = (width / 2) * ease(a);
  line(ctx, W / 2 - w, y, W / 2 - 12, y);
  line(ctx, W / 2 + 12, y, W / 2 + w, y);
  diamond(ctx, W / 2, y, 6);
  ctx.restore();
}

function cover(ctx: Ctx, img: Img, x: number, y: number, w: number, h: number, zoom: number, panY = 0) {
  const [iw, ih] = size(img);
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2 + panY, dw, dh);
}

function framePath(ctx: Ctx, kind: VideoDesign["frame"], x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  if (kind === "circle") {
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  } else if (kind === "arch") {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else {
    ctx.roundRect(x, y, w, h, kind === "rounded" ? 28 : 4);
  }
}

function photoFrame(ctx: Ctx, th: Theme, v: VideoDesign, img: Img | null, cx: number, cy: number, a: number, lt: number, tilt = 0) {
  if (a <= 0) return;
  const circle = v.frame === "circle";
  const w = circle ? 480 : 500, h = circle ? 480 : 660;
  const s = 0.94 + 0.06 * ease(a);
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  const x = -w / 2, y = -h / 2;
  if (v.frame === "polaroid") {
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#fbf8f2";
    ctx.fillRect(x - 22, y - 22, w + 44, h + 110);
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = rgba(th.accent, 0.5);
    ctx.shadowBlur = 40;
    framePath(ctx, v.frame, x, y, w, h);
    ctx.fillStyle = th.bg;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.save();
  framePath(ctx, v.frame, x, y, w, h);
  ctx.clip();
  if (img) cover(ctx, img, x, y, w, h, 1.04 + lt * 0.018, -lt * 3);
  else {
    ctx.fillStyle = th.card;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  if (v.frame !== "polaroid") {
    const gl = ((NOW * 0.5) % 2) - 0.5;
    const sg = ctx.createLinearGradient(x, y, x + w, y + h);
    const st = (n: number) => Math.min(1, Math.max(0, n));
    sg.addColorStop(0, th.accent);
    sg.addColorStop(st(gl - 0.15), th.accent);
    sg.addColorStop(st(gl), "#fff6dc");
    sg.addColorStop(st(gl + 0.15), th.accent);
    sg.addColorStop(1, th.accent);
    ctx.strokeStyle = sg;
    ctx.lineWidth = 3;
    framePath(ctx, v.frame, x, y, w, h);
    ctx.stroke();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 1.2;
    framePath(ctx, v.frame, x - 12, y - 12, w + 24, h + 24);
    ctx.stroke();
  }
  ctx.restore();
}

/** One function's own screen: its animated picture, name, date, time, venue and dress code. */
function drawFunction(
  ctx: Ctx, e: FunctionShow, lt: number, el: (i: number) => number, rise: (i: number) => number,
  o: { th: Theme; v: VideoDesign; script: TextOpts; display: TextOpts; body: TextOpts; eyebrowText: string },
) {
  const { th, v, script, display, body } = o;
  const lang = v.lang ?? "en";
  const gold = th.accent3 ?? th.accent;
  ctx.save();
  ctx.translate(0, 56);
  functionGlow(ctx, W, W / 2, 400, e.kind, el(0));
  eyebrow(ctx, th, o.eyebrowText, 150, el(0));
  functionMotif(ctx, e.kind, W / 2, 400, 118, lt, el(0), th.accent, gold);
  text(ctx, e.name, W / 2, 655, { ...script, size: 112, maxLines: 1 }, el(1), clamp((lt - 0.4) / 1.2));
  divider(ctx, th, 745, el(2), 260);
  const d = dateParts(e.date, lang);
  let y = 810;
  if (d) {
    text(ctx, `${d.weekday}, ${d.day} ${d.month}`, W / 2, y + rise(3), { family: th.display, size: 42, color: th.fg, weight: 500, maxLines: 1 }, el(3));
    y += 62;
  }
  if (e.time) {
    text(ctx, e.time, W / 2, y + rise(4), { family: th.body, size: 30, color: gold, weight: 600, spacing: 3, maxLines: 1 }, el(4));
    y += 70;
  }
  if (e.venue) {
    const h = text(ctx, e.venue, W / 2, y + rise(5), { ...body, size: 30, color: th.fg, maxLines: 2, lineH: 1.3 }, el(5));
    y += h + 22;
    if (e.address) { text(ctx, e.address, W / 2, y - 6, { ...body, size: 23, maxLines: 2 }, el(5)); y += 48; }
  }
  if (e.dress) {
    // A pill with the dress code.
    const label = `${lang === "hi" ? "परिधान" : "Dress code"}  ·  ${e.dress}`;
    ctx.save();
    ctx.font = `600 22px ${th.body}`;
    const w = Math.min(W - 120, ctx.measureText(label).width + 56);
    ctx.globalAlpha = el(6);
    ctx.strokeStyle = rgba(th.accent, 0.8);
    ctx.fillStyle = rgba(th.accent, 0.12);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - w / 2, y + 12, w, 54, 27);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    text(ctx, label, W / 2, y + 40, { family: th.body, size: 22, color: th.fg, weight: 600, maxLines: 1, maxW: w - 40 }, el(6));
  }
  ctx.restore();
}

function scene(ctx: Ctx, t: number, shot: Shot, f: Frame) {
  const th = f.config.theme;
  const v = f.config.video!;
  const vals = f.values;
  const s = shot.scene;
  const lt = t - shot.start;
  const out = 1 - smooth((lt - (shot.dur - 0.55)) / 0.55);
  const el = (i: number) => ease((lt - 0.2 - i * 0.28) / 0.8) * out;
  const rise = (i: number) => (1 - ease((lt - 0.2 - i * 0.28) / 0.8)) * 26;
  const fill = (str?: string) => (str ? fillText(str, vals) : "");
  const script: TextOpts = { family: th.hand, size: 104, color: th.fg, glow: rgba(th.accent, 0.45), maxLines: 2, lineH: 1.1, maxW: W - 120, shine: th.accent3 ?? th.accent };
  const display: TextOpts = { family: th.display, size: 52, color: th.fg, weight: 500, maxLines: 3, lineH: 1.2 };
  const body: TextOpts = { family: th.body, size: 27, color: th.muted, maxLines: 4, lineH: 1.45, maxW: W - 170 };

  switch (s.kind) {
    case "art": {
      const img = s.art ? f.assets.art[s.art] : null;
      ctx.save();
      ctx.globalAlpha = smooth(lt / 0.8) * out;
      if (img) cover(ctx, img, 0, 0, W, H, 1.04 + (lt / shot.dur) * 0.1, -lt * 4);
      const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,.82)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      eyebrow(ctx, th, fill(s.eyebrow), 960 + rise(0), el(0));
      text(ctx, fill(s.title), W / 2, 1050 + rise(1), { ...script, size: 84, color: "#fff8ec" }, el(1), clamp((lt - 0.5) / 1.4));
      text(ctx, fill(s.line), W / 2, 1150 + rise(2), { ...body, color: "#f4e7d2", size: 25, maxLines: 2 }, el(2));
      break;
    }
    case "title": {
      eyebrow(ctx, th, fill(s.eyebrow), 470 + rise(0), el(0));
      const h = text(ctx, fill(s.title), W / 2, 590 + rise(1), { ...display, size: 60, color: th.fg }, el(1));
      divider(ctx, th, 590 + h + 30, el(2));
      text(ctx, fill(s.line), W / 2, 590 + h + 100 + rise(3), body, el(3));
      break;
    }
    case "monogram": {
      const first = (a: string) => Array.from(fill(a).trim())[0]?.toUpperCase() ?? "";
      const a1 = first(vals.couple_one ?? ""), b1 = first(vals.couple_two ?? "");
      const cx = W / 2, cy = 560;
      ctx.save();
      ctx.globalAlpha = out;
      ctx.strokeStyle = th.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ease(lt / 1.8));
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = out * 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, 216, Math.PI / 2, Math.PI / 2 + Math.PI * 2 * ease((lt - 0.3) / 1.8));
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const an = (i / 4) * Math.PI * 2;
        ctx.globalAlpha = out * ease((lt - 1.4) / 0.6);
        ctx.fillStyle = th.accent;
        diamond(ctx, cx + Math.cos(an) * 216, cy + Math.sin(an) * 216, 6);
      }
      ctx.restore();
      eyebrow(ctx, th, fill(s.eyebrow), 280 + rise(0), el(0));
      if (b1) {
        text(ctx, a1, cx - 66, cy - 6, { ...script, size: 168, maxLines: 1 }, el(1), clamp((lt - 0.5) / 1.1));
        text(ctx, b1, cx + 66, cy + 24, { ...script, size: 168, maxLines: 1 }, el(2), clamp((lt - 1) / 1.1));
        text(ctx, "&", cx, cy + 4, { ...display, size: 50, color: th.accent, italic: true }, el(2));
      } else text(ctx, a1, cx, cy, { ...script, size: 200, maxLines: 1 }, el(1), clamp((lt - 0.5) / 1.1));
      divider(ctx, th, 850, el(3), 240);
      text(ctx, fill(s.line), W / 2, 920 + rise(4), { ...display, size: 40, color: th.fg, italic: true, maxLines: 2 }, el(4));
      break;
    }
    case "names": {
      const second = fill(s.second);
      eyebrow(ctx, th, fill(s.eyebrow), second ? 380 : 470, el(0));
      const y1 = second ? 520 : 610;
      text(ctx, fill(s.first), W / 2, y1, script, el(1), clamp((lt - 0.35) / 1.3));
      if (second) {
        flourish(ctx, W / 2, y1 + 130, 56, el(2), th.accent);
        text(ctx, s.joiner ?? "&", W / 2, y1 + 130, { ...display, family: th.display, size: 56, color: th.accent, italic: true }, el(2));
        text(ctx, second, W / 2, y1 + 260, script, el(3), clamp((lt - 1.2) / 1.3));
      }
      divider(ctx, th, second ? 880 : 760, el(4), 260);
      text(ctx, fill(s.line), W / 2, (second ? 950 : 830) + rise(5), body, el(5));
      break;
    }
    case "photo": {
      photoFrame(ctx, th, v, f.assets.photos[shot.photos[0]] ?? null, W / 2, 590, el(0) * 1.05, lt);
      text(ctx, fill(s.caption), W / 2, v.frame === "polaroid" ? 1000 : 1035, { ...script, size: 56, maxLines: 1, color: v.frame === "polaroid" ? th.fg : th.fg }, el(1));
      break;
    }
    case "gallery": {
      const per = s.perPhoto ?? 2.8;
      shot.photos.forEach((p, k) => {
        const a0 = k * per;
        const a = Math.min(smooth((lt - a0) / 0.6), k === shot.photos.length - 1 ? 1 : 1 - smooth((lt - a0 - per) / 0.6)) * out;
        const tilt = v.frame === "polaroid" ? (k % 2 ? 0.05 : -0.05) : 0;
        photoFrame(ctx, th, v, f.assets.photos[p] ?? null, W / 2, 590, a, lt - a0, tilt);
      });
      text(ctx, fill(s.caption), W / 2, 1060, { ...script, size: 56, maxLines: 1 }, el(0));
      break;
    }
    case "families": {
      eyebrow(ctx, th, fill(s.eyebrow) || "With the blessings of", 430, el(0));
      const lines = (vals.families ?? "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
      let y = 540;
      lines.forEach((l, i) => {
        const h = text(ctx, l, W / 2, y + rise(i + 1), { family: th.letter, size: 36, color: th.fg, italic: true, maxLines: 2, lineH: 1.3 }, el(i + 1));
        y += h + 26;
        if (i < lines.length - 1) divider(ctx, th, y, el(i + 1), 80);
        y += 30;
      });
      break;
    }
    case "date": {
      const d = dateParts(vals.event_date ?? "", v.lang);
      if (!d) break;
      sunburst(ctx, W / 2, 600, 400, t, th.accent3 ?? th.accent, el(2) * 0.9);
      eyebrow(ctx, th, fill(s.eyebrow) || "Save the date", 360, el(0));
      text(ctx, d.weekday, W / 2, 460 + rise(1), { ...body, family: th.display, size: 34, color: th.fg, spacing: 8, upper: true }, el(1));
      ctx.save();
      ctx.globalAlpha = el(2);
      ctx.strokeStyle = th.accent;
      ctx.lineWidth = 1.5;
      const span = 200 * ease(el(2));
      line(ctx, W / 2 - 100 - span, 620, W / 2 - 110, 620);
      line(ctx, W / 2 + 110, 620, W / 2 + 100 + span, 620);
      ctx.restore();
      text(ctx, d.day, W / 2, 625 + rise(2), { family: th.display, size: 190, color: th.accent3 ?? th.accent, weight: 500, glow: rgba(th.accent, 0.5), maxLines: 1, shine: "#ffffff" }, el(2));
      text(ctx, d.month, W / 2, 790 + rise(3), { family: th.display, size: 44, color: th.fg, spacing: 10, upper: true, maxLines: 1 }, el(3));
      text(ctx, d.year, W / 2, 855 + rise(3), { ...body, size: 28, color: th.muted, spacing: 8 }, el(3));
      divider(ctx, th, 930, el(4), 180);
      text(ctx, [vals.event_time, fill(s.line)].filter(Boolean).join(" · "), W / 2, 1000 + rise(5), { ...body, color: th.fg }, el(5));
      break;
    }
    case "venue": {
      eyebrow(ctx, th, fill(s.eyebrow) || "The venue", 420, el(0));
      // A small map pin
      ctx.save();
      ctx.globalAlpha = el(1);
      ctx.fillStyle = th.accent;
      ctx.translate(W / 2, 520 + rise(1));
      ctx.beginPath();
      ctx.arc(0, -10, 22, Math.PI, 0);
      ctx.quadraticCurveTo(22, 14, 0, 38);
      ctx.quadraticCurveTo(-22, 14, -22, -10);
      ctx.fill();
      ctx.fillStyle = th.bg;
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const h = text(ctx, vals.venue_name ?? "", W / 2, 640 + rise(2), { ...display, size: 54 }, el(2));
      divider(ctx, th, 640 + h + 24, el(3), 160);
      text(ctx, vals.venue_address ?? "", W / 2, 640 + h + 90 + rise(4), body, el(4));
      break;
    }
    case "events": {
      const lang = v.lang ?? "en";
      const evs = functionShows(vals, lang);
      if (shot.item !== undefined) {
        const e = evs[shot.item];
        if (!e) break;
        drawFunction(ctx, e, lt, el, rise, { th, v, script, display, body, eyebrowText: fill(s.eyebrow) || (lang === "hi" ? "आपका स्वागत है" : "Join us for the") });
        break;
      }
      eyebrow(ctx, th, fill(s.eyebrow) || (lang === "hi" ? "उत्सव" : "The celebrations"), 175, el(0));
      text(ctx, fill(s.title) || (lang === "hi" ? "कार्यक्रम" : "Join us for"), W / 2, 270, { ...script, size: 74, maxLines: 1 }, el(1), clamp((lt - 0.4) / 1.2));
      const rowH = Math.min(150, 840 / evs.length);
      evs.forEach((e, i) => {
        const a = ease((lt - 0.9 - i * 1.3) / 0.7) * out;
        const y = 395 + i * rowH + (1 - a) * 20;
        const look = FUNCTION_LOOK[e.kind];
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = look.tint;
        diamond(ctx, 96, y + rowH * 0.2, 7);
        ctx.restore();
        text(ctx, e.name, W / 2, y, { family: th.display, size: Math.min(40, rowH * 0.32), color: th.accent3 ?? th.accent, weight: 500, maxLines: 1 }, a);
        const when = [shortDate(e.date, lang), e.time].filter(Boolean).join("  ·  ");
        text(ctx, when, W / 2, y + rowH * 0.3, { ...body, size: Math.min(26, rowH * 0.2), color: th.fg, maxLines: 1 }, a);
        if (e.venue) text(ctx, e.venue, W / 2, y + rowH * 0.5, { ...body, size: Math.min(23, rowH * 0.17), maxLines: 1 }, a);
        if (i < evs.length - 1) {
          ctx.save();
          ctx.globalAlpha = a * 0.4;
          ctx.strokeStyle = th.accent;
          ctx.lineWidth = 1;
          line(ctx, W / 2 - 120, y + rowH * 0.72, W / 2 + 120, y + rowH * 0.72);
          ctx.restore();
        }
      });
      break;
    }
    case "message": {
      eyebrow(ctx, th, fill(s.eyebrow), 400, el(0));
      text(ctx, vals[s.field] ?? "", W / 2, 520 + rise(1), { family: th.letter, size: 36, color: th.fg, italic: true, maxLines: 8, lineH: 1.45, maxW: W - 170 }, el(1));
      break;
    }
    case "closing": {
      text(ctx, fill(s.title), W / 2, 520, { ...script, size: 96 }, el(0), clamp((lt - 0.2) / 1.4));
      divider(ctx, th, 650, el(1), 240);
      text(ctx, fill(s.line), W / 2, 730 + rise(2), body, el(2));
      text(ctx, fill(s.signoff), W / 2, 880 + rise(3), { ...display, size: 36, color: th.accent3 ?? th.accent, maxLines: 2 }, el(3));
      break;
    }
  }
}

/* ---------------- watermark ---------------- */

function watermark(ctx: Ctx, t: number, label: string) {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.font = "700 26px system-ui, sans-serif";
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "3px";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,.5)";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.42);
  const drift = (t * 18) % 340;
  for (let row = -6; row <= 6; row++) {
    for (let col = -2; col <= 2; col++) {
      const x = col * 340 + drift + (row % 2 ? 170 : 0) - 170;
      const y = row * 150;
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    }
  }
  ctx.restore();
}

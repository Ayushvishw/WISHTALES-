"use client";

import type { Theme, VideoDesign } from "@/lib/templates/schema";
import type { Img } from "./render";

export const clipUrl = (name: string) => `/video/clips/${name}.mp4`;

/** Adds the theme's Google Fonts and waits until the canvas can draw with them. */
export async function loadFonts(theme: Theme) {
  if (theme.fonts && !document.querySelector(`link[data-vfonts="${theme.fonts}"]`)) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?${theme.fonts}&display=swap`;
    l.dataset.vfonts = theme.fonts;
    document.head.appendChild(l);
    await new Promise((r) => { l.onload = r; l.onerror = r; setTimeout(r, 4000); });
  }
  const sample = "Aa & 0123 नमः";
  await Promise.all(
    [theme.display, theme.hand, theme.body, theme.letter].flatMap((fam) => [
      document.fonts.load(`400 48px ${fam}`, sample),
      document.fonts.load(`italic 400 48px ${fam}`, sample),
      document.fonts.load(`600 48px ${fam}`, sample),
    ]).map((p) => p.catch(() => null)),
  );
}

export function loadImage(url: string): Promise<Img | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

export async function loadStills(video: VideoDesign, photos: string[]) {
  const art: Partial<Record<string, Img>> = {};
  const names = [...new Set(video.scenes.flatMap((s) => (s.kind === "art" ? [s.art] : [])))];
  const [ps, arts] = await Promise.all([Promise.all(photos.map(loadImage)), Promise.all(names.map((n) => loadImage(`/art/wedding/${n}.webp`)))]);
  names.forEach((n, i) => { if (arts[i]) art[n] = arts[i]!; });
  return { photos: ps, art };
}

export const clipNames = (video: VideoDesign) => [...new Set(video.scenes.flatMap((s) => (s.clip ? [s.clip] : [])))];

/**
 * Background clips for the live preview: muted <video> elements kept in step with
 * the preview clock. A clip that hasn't loaded yet simply isn't drawn.
 */
export class LiveClips {
  private els = new Map<string, HTMLVideoElement>();
  constructor(names: string[]) {
    for (const n of names) {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.loop = true;
      v.crossOrigin = "anonymous";
      v.src = clipUrl(n);
      this.els.set(n, v);
    }
  }
  frame(name: string): Img | null {
    const v = this.els.get(name);
    return v && v.readyState >= 2 && v.videoWidth ? v : null;
  }
  /** Plays the active clip near `at` seconds and pauses the rest. */
  sync(active: string | undefined, at: number, playing: boolean) {
    for (const [n, v] of this.els) {
      if (n !== active) { if (!v.paused) v.pause(); continue; }
      const d = v.duration || 0;
      const want = d ? at % d : at;
      if (Math.abs(v.currentTime - want) > 0.3) v.currentTime = want;
      if (playing && v.paused) void v.play().catch(() => {});
      if (!playing && !v.paused) v.pause();
    }
  }
  dispose() {
    for (const v of this.els.values()) { v.pause(); v.removeAttribute("src"); v.load(); }
    this.els.clear();
  }
}

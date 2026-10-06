"use client";

/**
 * Audio layer, independent of templates. A track source is either
 * "builtin:<generator>" (synthesized here, so no licensed file is needed) or a
 * media URL. Browsers block audio until the viewer interacts, so callers must
 * call unlock() inside a pointer or key handler first.
 */
type Player = { stop(): void };

let ctx: AudioContext | null = null;
let current: Player | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;

/** Everything audible goes through one analyser so visuals can follow the music. */
function out(c: AudioContext): AudioNode {
  if (!analyser) {
    analyser = c.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(c.destination);
    bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }
  return analyser;
}

/** Loudness 0–1 overall and in five bands, or null when nothing is measurable. */
export function audioLevel(): { lvl: number; bands: number[] } | null {
  if (!analyser || !bins || !current) return null;
  analyser.getByteFrequencyData(bins);
  const n = bins.length;
  const band = (a: number, b: number) => {
    let sum = 0;
    for (let i = Math.floor(a * n); i < Math.floor(b * n); i++) sum += bins![i];
    return sum / Math.max(1, Math.floor(b * n) - Math.floor(a * n)) / 255;
  };
  const bands = [band(0, 0.06), band(0.06, 0.14), band(0.14, 0.28), band(0.28, 0.5), band(0.5, 0.8)];
  return { lvl: Math.min(1, (bands[0] * 1.4 + bands[1] + bands[2]) / 2.6), bands };
}

export function unlockAudio(): boolean {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export function isPlaying() {
  return current !== null;
}

export function stopAudio() {
  current?.stop();
  current = null;
}

/** Returns false when audio can't play; the experience carries on silently. */
export function playAudio(source: string): boolean {
  stopAudio();
  if (source.startsWith("builtin:")) {
    if (!unlockAudio() || !ctx) return false;
    current = synth(ctx, source.slice(8));
    return current !== null;
  }
  const el = new Audio(source);
  el.loop = true;
  el.volume = 0.6;
  // Route through the analyser when possible. Media is same-origin, so this is allowed.
  if (unlockAudio() && ctx) {
    try {
      ctx.createMediaElementSource(el).connect(out(ctx));
    } catch {
      /* plays directly, just without visuals */
    }
  }
  el.play().catch(() => stopAudio());
  current = { stop: () => el.pause() };
  return true;
}

const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function synth(c: AudioContext, gen: string): Player | null {
  const bus = c.createGain();
  bus.gain.value = 0.8;
  bus.connect(out(c));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;

  const note = (f: number, t: number, d: number, pad = false) => {
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o2.type = pad ? "triangle" : "sine";
    o.frequency.value = f;
    o2.frequency.value = pad ? f / 2 : f * 2;
    g.gain.setValueAtTime(0.0001, t);
    if (pad) {
      g.gain.linearRampToValueAtTime(0.06, t + 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
    } else {
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.6, d * 1.6));
    }
    o.connect(g); o2.connect(g); g.connect(bus);
    o.start(t); o2.start(t);
    o.stop(t + d * 1.8 + 0.5); o2.stop(t + d * 1.8 + 0.5);
  };

  const loops: Record<string, () => number> = {
    // "Happy Birthday to You" melody (public domain), music-box voice.
    hbd: () => {
      const beat = 0.4;
      const N: [number, number][] = [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2], [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2],
        [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2], [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 3]];
      let t = c.currentTime + 0.08;
      for (const [n, d] of N) { note(hz(n + 12), t, d * beat); t += d * beat; }
      return N.reduce((s, [, d]) => s + d, 0) * beat + 1.2;
    },
    // Pachelbel's Canon in D (public domain): the ground bass chords with the famous falling melody, music-box voice.
    canon: () => {
      const ch = [[50, 62, 66, 69], [45, 61, 64, 69], [47, 62, 66, 71], [42, 61, 66, 69], [43, 59, 62, 67], [38, 57, 62, 66], [43, 59, 62, 67], [45, 61, 64, 69]];
      const top = [78, 76, 74, 73, 71, 69, 71, 73];
      const d = 2;
      let t = c.currentTime + 0.08;
      ch.forEach((cn, i) => {
        cn.forEach((n) => note(hz(n), t, d, true));
        note(hz(top[i]), t, 0.9);
        note(hz(top[i] - 12 + 7), t + 1, 0.5);
        note(hz(top[i] - 5), t + 1.5, 0.4);
        t += d;
      });
      return ch.length * d;
    },
    // Original I–vi–IV–V pad with a light melody.
    chords: () => {
      const ch = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
      const d = 2.4;
      let t = c.currentTime + 0.08;
      for (const cn of ch) {
        cn.forEach((n) => note(hz(n), t, d, true));
        note(hz(cn[3] + 12), t + 0.6, 0.5);
        note(hz(cn[2] + 12), t + 1.4, 0.5);
        t += d;
      }
      return ch.length * d;
    },
  };
  const loop = loops[gen];
  if (!loop) return null;
  const run = () => {
    if (!alive) return;
    const len = loop();
    timer = setTimeout(run, len * 1000 - 120);
  };
  run();
  return {
    stop() {
      alive = false;
      clearTimeout(timer);
      bus.gain.setTargetAtTime(0, c.currentTime, 0.08);
      setTimeout(() => bus.disconnect(), 400);
    },
  };
}

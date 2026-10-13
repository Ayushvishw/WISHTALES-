"use client";

import { scheduleTune } from "@/experience/audio";

const RATE = 48000;

/**
 * The video's whole soundtrack as one AudioBuffer, exactly as long as the video:
 * a built-in tune played on repeat, or the customer's song (looped if it is short),
 * faded in and out. The preview plays this same buffer, so it sounds like the file.
 */
export async function renderMusic(source: string, seconds: number): Promise<AudioBuffer | null> {
  const len = Math.ceil(seconds * RATE);
  const off = new OfflineAudioContext(2, len, RATE);
  const master = off.createGain();
  master.connect(off.destination);
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(1, 0.8);
  master.gain.setValueAtTime(1, Math.max(0.9, seconds - 2.2));
  master.gain.linearRampToValueAtTime(0, seconds);
  if (source.startsWith("builtin:")) {
    const bus = off.createGain();
    bus.gain.value = 0.8;
    bus.connect(master);
    for (let t = 0.1; t < seconds; ) {
      const l = scheduleTune(off, bus, source.slice(8), t);
      if (!l) return null;
      t += l;
    }
  } else {
    const res = await fetch(source);
    if (!res.ok) return null;
    const song = await off.decodeAudioData(await res.arrayBuffer());
    const node = off.createBufferSource();
    node.buffer = song;
    node.loop = song.duration < seconds;
    const g = off.createGain();
    g.gain.value = 0.9;
    node.connect(g).connect(master);
    node.start(0);
  }
  return off.startRendering();
}

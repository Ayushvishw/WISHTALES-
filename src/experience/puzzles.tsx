"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "@/lib/templates/schema";

/**
 * Puzzle library. Each puzzle reports completion through onSolved and must
 * solve itself when `forced` becomes true (the "Show me" fallback).
 * No puzzle state is stored anywhere.
 */
type PuzzleProps = { photos: string[]; reveal: string; theme: Theme; forced: boolean; onSolved(): void };

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function Scratch({ photos, reveal, theme, forced, onSolved }: PuzzleProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);
  const down = useRef(false);
  const moves = useRef(0);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width;
    c.height = r.height;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (!x) return;
    const g = x.createLinearGradient(0, 0, r.width, r.height);
    g.addColorStop(0, theme.accent);
    g.addColorStop(1, theme.accent2);
    x.fillStyle = g;
    x.fillRect(0, 0, r.width, r.height);
    x.fillStyle = "rgba(255,255,255,.85)";
    x.font = "600 15px system-ui, sans-serif";
    x.textAlign = "center";
    x.fillText("Scratch here", r.width / 2, r.height / 2);
    x.globalCompositeOperation = "destination-out";
  }, [theme]);

  useEffect(() => {
    if (forced && !cleared) { setCleared(true); onSolved(); }
  }, [forced, cleared, onSolved]);

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = cv.current;
    const x = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !x || cleared) return;
    const r = c.getBoundingClientRect();
    x.beginPath();
    x.arc(e.clientX - r.left, e.clientY - r.top, 22, 0, 7);
    x.fill();
    if (++moves.current % 12 === 0) {
      const px = x.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      for (let k = 3; k < px.length; k += 64) if (px[k] === 0) clear++;
      if (clear / (px.length / 64) > 0.5) { setCleared(true); onSolved(); }
    }
  };

  return (
    <div className="x-scratch">
      <img src={photos[0]} alt="" />
      {reveal && <div className="line">{reveal}</div>}
      <canvas
        ref={cv}
        aria-label="Scratch card. Use the Show me button if you can't scratch."
        style={cleared ? { opacity: 0, pointerEvents: "none" } : undefined}
        onPointerDown={(e) => { down.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
        onPointerMove={(e) => down.current && scratch(e)}
        onPointerUp={() => (down.current = false)}
        onPointerCancel={() => (down.current = false)}
      />
    </div>
  );
}

const SOLVED9 = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function Swap({ photos, forced, onSolved }: PuzzleProps) {
  const [order, setOrder] = useState<number[]>(() => {
    let o: number[];
    do o = shuffle(SOLVED9); while (o.every((v, i) => v === i));
    return o;
  });
  const [sel, setSel] = useState<number | null>(null);
  const solved = order.every((v, i) => v === i);

  useEffect(() => { if (forced) setOrder(SOLVED9); }, [forced]);
  useEffect(() => { if (solved) onSolved(); }, [solved, onSolved]);

  const tap = (k: number) => {
    if (solved) return;
    if (sel === null) return setSel(k);
    const o = [...order];
    [o[sel], o[k]] = [o[k], o[sel]];
    setOrder(o);
    setSel(null);
  };
  return (
    <div className={solved ? "x-jig solved" : "x-jig"}>
      {order.map((v, k) => (
        <button
          key={k}
          className={sel === k ? "sel" : ""}
          aria-label={`Tile ${k + 1}${sel === k ? ", selected" : ""}`}
          onClick={() => tap(k)}
          style={{ backgroundImage: `url(${photos[0]})`, backgroundPosition: `${(v % 3) * 50}% ${Math.floor(v / 3) * 50}%` }}
        />
      ))}
    </div>
  );
}

function Match({ photos, forced, onSolved }: PuzzleProps) {
  const deck = useMemo(() => shuffle([...photos.keys(), ...photos.keys()]), [photos]);
  const [up, setUp] = useState<number[]>([]);
  const [got, setGot] = useState<Set<number>>(new Set());
  const lock = useRef(false);
  const done = got.size === photos.length;

  useEffect(() => { if (forced) setGot(new Set(photos.keys())); }, [forced, photos]);
  useEffect(() => { if (done) onSolved(); }, [done, onSolved]);

  const flip = (k: number) => {
    if (lock.current || up.includes(k) || got.has(deck[k])) return;
    const next = [...up, k];
    setUp(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (deck[a] === deck[b]) {
      setGot((g) => new Set(g).add(deck[a]));
      setUp([]);
    } else {
      lock.current = true;
      setTimeout(() => { setUp([]); lock.current = false; }, 900);
    }
  };
  return (
    <div className="x-match">
      {deck.map((v, k) => {
        const open = up.includes(k) || got.has(v);
        return (
          <button key={k} className={`x-card${open ? " up" : ""}${got.has(v) ? " got" : ""}`} aria-label={`Card ${k + 1}`} onClick={() => flip(k)}>
            <div className="in">
              <div className="f">✦</div>
              <div className="b" style={{ backgroundImage: `url(${photos[v]})` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const PUZZLES = { scratch: Scratch, swap: Swap, match: Match };

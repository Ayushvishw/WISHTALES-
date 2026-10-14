"use client";

import { FUNCTION_KINDS, MAX_FUNCTIONS, USUAL, functionName, kindInfo, parseFunctions, serializeFunctions, type FunctionKind, type WeddingFunction } from "@/lib/functions";

const OFFSET: Partial<Record<FunctionKind, number>> = { roka: -30, engagement: -20, ganesh: -3, mehendi: -2, haldi: -1, sangeet: -1, cocktail: -1, baraat: 0, wedding: 0, reception: 1 };

function shift(ymd: string, days: number) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? Date.parse(`${ymd}T12:00:00Z`) : Date.now() + 30 * 864e5;
  return new Date(base + days * 864e5).toISOString().slice(0, 10);
}

/** Add each ceremony of an Indian wedding with its own date, time, venue and dress code. */
export function FunctionsEditor({ id, label, help, value, error, mainDate, onChange, hindi }: {
  id: string; label: string; help?: string; value: string; error?: string; mainDate: string; onChange: (v: string) => void; hindi?: boolean;
}) {
  const list = parseFunctions(value);
  const lang = hindi ? "hi" : "en";
  const set = (next: WeddingFunction[]) => onChange(serializeFunctions(next));
  const edit = (i: number, patch: Partial<WeddingFunction>) => set(list.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const add = (kind: FunctionKind) => {
    const info = kindInfo(kind);
    set([...list, { kind, date: shift(mainDate, OFFSET[kind] ?? 0), time: info.time, dress: info.dress }]);
  };
  const addUsual = () => {
    const have = new Set(list.map((f) => f.kind));
    const more = USUAL.filter((k) => !have.has(k)).map((kind): WeddingFunction => ({ kind, date: shift(mainDate, OFFSET[kind] ?? 0), time: kindInfo(kind).time, dress: kindInfo(kind).dress }));
    set([...list, ...more].slice(0, MAX_FUNCTIONS));
  };
  const swap = (i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  const full = list.length >= MAX_FUNCTIONS;
  return (
    <div className={`fn-ed wide${error ? " invalid" : ""}`} id={id}>
      <span className="fn-label">{label} <em>(optional)</em></span>
      {help && <small>{help}</small>}
      {list.map((f, i) => (
        <div className="fn-card" key={i}>
          <div className="fn-head">
            <b>{functionName(f, lang)}</b>
            <span className="fn-acts">
              <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => swap(i, -1)}>↑</button>
              <button type="button" aria-label="Move later" disabled={i === list.length - 1} onClick={() => swap(i, 1)}>↓</button>
              <button type="button" aria-label={`Remove ${functionName(f, lang)}`} onClick={() => set(list.filter((_, k) => k !== i))}>✕</button>
            </span>
          </div>
          <div className="fn-grid">
            <label>Function
              <select value={f.kind} onChange={(e) => { const kind = e.target.value as FunctionKind; const info = kindInfo(kind); edit(i, { kind, time: f.time || info.time, dress: f.dress || info.dress }); }}>
                {FUNCTION_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.en}</option>)}
              </select>
            </label>
            {f.kind === "custom" && <label>Name <input value={f.name ?? ""} maxLength={30} placeholder="Tilak" onChange={(e) => edit(i, { name: e.target.value })} /></label>}
            <label>Date <input type="date" value={f.date} onChange={(e) => edit(i, { date: e.target.value })} /></label>
            <label>Time <input value={f.time ?? ""} maxLength={40} placeholder="4:00 pm onwards" onChange={(e) => edit(i, { time: e.target.value })} /></label>
            <label className="fn-w">Venue <input value={f.venue ?? ""} maxLength={80} placeholder="Leave empty to use the main venue" onChange={(e) => edit(i, { venue: e.target.value })} /></label>
            <label className="fn-w">Address <input value={f.address ?? ""} maxLength={120} placeholder="Optional" onChange={(e) => edit(i, { address: e.target.value })} /></label>
            <label className="fn-w">Dress code <input value={f.dress ?? ""} maxLength={60} placeholder="e.g. Yellow" onChange={(e) => edit(i, { dress: e.target.value })} /></label>
          </div>
        </div>
      ))}
      <div className="fn-add">
        {!list.length || list.length < USUAL.length ? <button type="button" className="btn small" disabled={full} onClick={addUsual}>Add the usual functions</button> : null}
        <select aria-label="Add one function" value="" disabled={full} onChange={(e) => { if (e.target.value) add(e.target.value as FunctionKind); }}>
          <option value="">+ Add one function…</option>
          {FUNCTION_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.en}</option>)}
        </select>
        {list.length > 0 && <button type="button" className="btn ghost small" onClick={() => set([])}>Clear all</button>}
      </div>
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}

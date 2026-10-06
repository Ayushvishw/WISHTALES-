"use client";

import { useState, type ReactNode } from "react";

export type GridItem = { key: string; tags: string[]; node: ReactNode };

/** Filter chips over a grid of cards. Cards that don't match fold away instead of jumping. */
export function FilterGrid({ filters, items }: { filters: { key: string; label: string }[]; items: GridItem[] }) {
  const [on, setOn] = useState("all");
  const count = (k: string) => (k === "all" ? items.length : items.filter((i) => i.tags.includes(k)).length);
  return (
    <>
      <div className="chipbar" role="toolbar" aria-label="Filter templates">
        {[{ key: "all", label: "All" }, ...filters].filter((f) => count(f.key) > 0).map((f) => (
          <button key={f.key} className={on === f.key ? "on" : ""} aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
            {f.label}<i>{count(f.key)}</i>
          </button>
        ))}
      </div>
      <div className="tgrid2">
        {items.map((it) => {
          const show = on === "all" || it.tags.includes(on);
          return (
            <div key={it.key} className={`tg-cell${show ? "" : " hide"}`} inert={!show}>
              {it.node}
            </div>
          );
        })}
      </div>
    </>
  );
}

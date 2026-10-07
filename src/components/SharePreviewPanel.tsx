"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";

/** Lets the creator send the watermarked preview to family or friends before paying. */
export function SharePreviewPanel({ draftKey, recipient, template }: { draftKey: string; recipient: string; template: string }) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const make = async () => {
    if (url) return url;
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(`/api/drafts/${draftKey}/share-preview`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || "Couldn't make the link. Please try again.");
      setUrl(body.url);
      track("preview_shared", template);
      return body.url;
    } catch (e) {
      setNote((e as Error).message);
      return "";
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    const u = await make();
    if (!u) return;
    try {
      await navigator.clipboard.writeText(u);
      setNote("Link copied.");
    } catch {
      input.current?.select();
      setNote("Press Ctrl+C or Cmd+C to copy the selected link.");
    }
  };

  const whatsapp = async () => {
    // Open the window first so the browser doesn't block it as a popup, then point it at WhatsApp.
    const w = window.open("", "_blank");
    const u = await make();
    if (!u) { w?.close(); return; }
    const text = `I'm making a surprise for ${recipient}. Can you take a look before I send it? ${u}`;
    if (w) w.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="panel">
      <div className="eyebrow">Ask someone first</div>
      <h3>Share this preview</h3>
      <p className="note" style={{ margin: 0 }}>Send it to family or a friend for a second opinion before you pay. They can watch it with the watermark but can&apos;t change anything. It stops working once you send the real one.</p>
      {url && (
        <div className="linkbox">
          <input ref={input} readOnly value={url} aria-label="Preview link" onFocus={(e) => e.target.select()} />
        </div>
      )}
      <div className="row">
        <button className="btn small" onClick={copy} disabled={busy}>{busy ? "Making link…" : "Copy preview link"}</button>
        <button className="btn ghost small" onClick={whatsapp} disabled={busy}>Send on WhatsApp</button>
      </div>
      {note && <span className="note" role="status">{note}</span>}
    </div>
  );
}

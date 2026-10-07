"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";

export function SharePanel({ url, recipient, template, invitation = false }: { url: string; recipient: string; template: string; invitation?: boolean }) {
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const text = invitation
    ? `You're invited! Open your invitation and let us know if you can make it: ${url}`
    : `${recipient}, I made something for you. Open it when you have a quiet minute: ${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied.");
    } catch {
      input.current?.select();
      setNote("Press Ctrl+C or Cmd+C to copy the selected link.");
    }
    track("share_link_copied", template);
  };
  return (
    <>
      <div className="linkbox">
        <input ref={input} readOnly value={url} aria-label="Your link" onFocus={(e) => e.target.select()} />
        <button className="btn" onClick={copy}>Copy link</button>
      </div>
      <div className="row">
        <a className="btn accent" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => track("share_whatsapp", template)}>
          Share on WhatsApp
        </a>
        <a className="btn ghost" href={url} target="_blank" rel="noopener noreferrer">{invitation ? "Open it as a guest would" : `Open it as ${recipient} would`}</a>
      </div>
      <p className="note" role="status" style={{ margin: 0 }}>{note}</p>
    </>
  );
}

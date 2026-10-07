"use client";

import { useState } from "react";

type Reply = { id: string; name: string; attending: "yes" | "no" | "maybe"; guests: number; message: string | null; hidden: boolean; at: string };

const LABEL = { yes: "Coming", maybe: "Maybe", no: "Can't come" } as const;

/** The host's guest list: who replied, how many are coming, and which wishes show on the wall. */
export function RsvpPanel({ draftKey, replies: initial }: { draftKey: string; replies: Reply[] }) {
  const [replies, setReplies] = useState(initial);
  const [error, setError] = useState("");
  const coming = replies.filter((r) => r.attending === "yes");
  const maybe = replies.filter((r) => r.attending === "maybe");
  const people = coming.reduce((n, r) => n + r.guests, 0);

  const toggle = async (r: Reply) => {
    setError("");
    const hidden = !r.hidden;
    setReplies((rs) => rs.map((x) => (x.id === r.id ? { ...x, hidden } : x)));
    const res = await fetch(`/api/drafts/${draftKey}/rsvps/${r.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ hidden }) }).catch(() => null);
    if (!res?.ok) {
      setReplies((rs) => rs.map((x) => (x.id === r.id ? { ...x, hidden: r.hidden } : x)));
      setError("Couldn't change that wish. Please try again.");
    }
  };

  const csv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Name", "Reply", "Guests", "Wish", "Replied at"], ...replies.map((r) => [r.name, LABEL[r.attending], String(r.guests), r.message ?? "", new Date(r.at).toLocaleString("en-IN")])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(esc).join(",")).join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "guest-replies.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <div className="eyebrow">Guest replies</div>
      <h3>{people} {people === 1 ? "person is" : "people are"} coming</h3>
      <p className="note" style={{ margin: 0 }}>
        {coming.length} {coming.length === 1 ? "reply says" : "replies say"} yes, {maybe.length} maybe, {replies.length - coming.length - maybe.length} can&apos;t come. Refresh this page to see new replies.
      </p>
      {replies.length > 0 ? (
        <>
          <ul className="rsvp-list">
            {replies.map((r) => (
              <li key={r.id} className={r.hidden ? "hidden" : ""}>
                <div className="rsvp-top">
                  <b>{r.name}</b>
                  <span className={`rsvp-tag ${r.attending}`}>{LABEL[r.attending]}{r.attending !== "no" ? ` · ${r.guests}` : ""}</span>
                </div>
                {r.message && (
                  <div className="rsvp-msg">
                    <p>{r.message}</p>
                    <button className="btn ghost small" onClick={() => toggle(r)}>{r.hidden ? "Show on the wall" : "Hide from the wall"}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="row"><button className="btn ghost small" onClick={csv}>Download the guest list</button></div>
        </>
      ) : (
        <p className="note" style={{ margin: 0 }}>No replies yet. They appear here as guests answer your invitation.</p>
      )}
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}

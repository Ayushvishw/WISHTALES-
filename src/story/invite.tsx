"use client";

import { useEffect, useState } from "react";
import type { Chapter } from "@/lib/templates/schema";
import { Motif } from "./art";
import { Head, Section } from "./chapters";
import { Obj } from "./obj";
import type { StoryContext } from "./Story";

/* Chapters made for invitations: the card, a countdown, the schedule, the venue, replies and wishes. */

type Of<T extends Chapter["type"]> = Extract<Chapter, { type: T }>;
type P<T extends Chapter["type"]> = { chapter: Of<T>; ctx: StoryContext; num: number | null };

const parts = (line: string) => line.split("|").map((s) => s.trim());

function dateOf(raw: string | undefined) {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Only real web links: a customer's text never becomes a javascript: or data: link. */
export function safeLink(raw: string | undefined) {
  const s = (raw ?? "").trim();
  if (!/^https:\/\//i.test(s)) return null;
  try {
    return new URL(s).toString();
  } catch {
    return null;
  }
}

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/* ---------------- the invitation card ---------------- */

function Invite({ chapter, ctx }: P<"invite">) {
  const d = dateOf(ctx.values.event_date);
  const time = ctx.values.event_time;
  const venue = ctx.values.venue_name;
  const families = chapter.families ? ctx.fill(chapter.families) : "";
  return (
    <Section center className="st-invite-sec">
      <div className="st-invite">
        <span className="st-inv-corner tl" aria-hidden="true" /><span className="st-inv-corner tr" aria-hidden="true" />
        <span className="st-inv-corner bl" aria-hidden="true" /><span className="st-inv-corner br" aria-hidden="true" />
        <p className="st-inv-eyebrow">{ctx.fill(chapter.eyebrow)}</p>
        {families && <p className="st-inv-families">{families}</p>}
        <p className="st-inv-intro">{ctx.fill(chapter.intro)}</p>
        <h1 className="st-inv-names">{ctx.fill(chapter.names)}</h1>
        <p className="st-inv-line">{ctx.fill(chapter.line)}</p>
        <div className="st-inv-rule" aria-hidden="true"><i /><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={18} /><i /></div>
        {d && (
          <div className="st-inv-date">
            <span>{d.toLocaleDateString("en-IN", { weekday: "long" })}</span>
            <b>{d.getDate()}</b>
            <span>{d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
          </div>
        )}
        {(time || venue) && <p className="st-inv-where">{[time, venue].filter(Boolean).join(" · ")}</p>}
      </div>
    </Section>
  );
}

/* ---------------- countdown ---------------- */

function until(target: number, now: number) {
  const ms = Math.max(0, target - now);
  return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60, done: ms === 0 };
}

function Countdown({ chapter, ctx, num }: P<"countdown">) {
  const d = dateOf(ctx.values[chapter.field]);
  // Counts to the start of the day; the exact hour is often "evening onwards", not a time.
  const target = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : 0;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!d) return null;
  const left = until(target, now ?? target);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      {now !== null && left.done ? (
        <p className="st-cd-done">{ctx.fill(chapter.done)}</p>
      ) : (
        <div className="st-cd" role="timer" aria-live="off">
          {([["d", "Days"], ["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]] as const).map(([k, label]) => (
            <div key={k} className="st-cd-cell">
              <b>{now === null ? "–" : String(left[k]).padStart(k === "d" ? 1 : 2, "0")}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------------- schedule ---------------- */

function Events({ chapter, ctx, num }: P<"events">) {
  const items = (ctx.values[chapter.field] ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((l) => {
      const [name = "", when = "", where = "", link = ""] = parts(l);
      return { name, when, where, link: safeLink(link) ?? (where ? mapsSearch(where) : null) };
    })
    .filter((e) => e.name);
  if (!items.length) return null;
  return (
    <Section>
      <Head chapter={chapter} ctx={ctx} num={num} />
      <ol className="st-events">
        {items.map((e, i) => (
          <li key={i} className="st-event" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="st-ev-dot" aria-hidden="true"><Motif kind={ctx.story.motif} fill={ctx.theme.accent} size={16} /></span>
            <div className="st-ev-body">
              <h3>{e.name}</h3>
              {e.when && <p className="st-ev-when">{e.when}</p>}
              {e.where && <p className="st-ev-where">{e.where}</p>}
            </div>
            {e.link && <a className="st-ev-map" href={e.link} target="_blank" rel="noopener noreferrer">Directions</a>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------- venue ---------------- */

function calendarLink(ctx: StoryContext) {
  const d = dateOf(ctx.values.event_date);
  if (!d) return null;
  const ymd = (x: Date) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
  const next = new Date(d.getTime() + 864e5);
  // The calendar entry is named after the invitation card, e.g. "Lisa & Andrew".
  const card = ctx.story.chapters.find((c) => c.type === "invite");
  const title = card && card.type === "invite" ? ctx.fill(card.names) : ctx.fill("{{sender_name}}");
  const where = [ctx.values.venue_name, ctx.values.venue_address].filter(Boolean).join(", ");
  const details = ctx.values.event_time ? `Time: ${ctx.values.event_time}` : "";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${ymd(d)}/${ymd(next)}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(details)}`;
}

function Venue({ chapter, ctx, num }: P<"venue">) {
  const name = ctx.values.venue_name;
  const address = ctx.values.venue_address;
  if (!name && !address) return null;
  const map = safeLink(ctx.values.map_link) ?? mapsSearch([name, address].filter(Boolean).join(", "));
  const cal = calendarLink(ctx);
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      <div className="st-venue">
        {name && <h3>{name}</h3>}
        {address && <p>{address}</p>}
        {ctx.values.event_time && <p className="st-venue-time">{ctx.values.event_time}</p>}
        <div className="st-venue-btns">
          <a className="st-btn accent" href={map} target="_blank" rel="noopener noreferrer">Get directions</a>
          {cal && <a className="st-btn ghost" href={cal} target="_blank" rel="noopener noreferrer">Add to calendar</a>}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- replies ---------------- */

const CHOICES = [
  { v: "yes", label: "Joyfully accept" },
  { v: "maybe", label: "Not sure yet" },
  { v: "no", label: "Regretfully decline" },
] as const;

function Rsvp({ chapter, ctx, num }: P<"rsvp">) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "maybe" | "">("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const token = ctx.guest?.token ?? null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Add your name.");
    if (!attending) return setError("Choose whether you can come.");
    if (!token) {
      ctx.toast("This is a preview. Replies reach the hosts once the invitation is sent.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`/api/rsvp/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, attending, guests, message }) });
      const body = (await res.json().catch(() => ({}))) as { error?: string; wish?: { name: string; message: string } | null };
      if (!res.ok) throw new Error(body.error || "Couldn't send. Please try again.");
      if (body.wish) ctx.guest?.add(body.wish);
      setState("done");
      if (attending !== "no") ctx.celebrate();
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      {state === "done" ? (
        <div className="st-rsvp-done"><Obj name="love_letter" size={84} /><p>{ctx.fill(chapter.thanks)}</p></div>
      ) : (
        <form className="st-rsvp" onSubmit={send} noValidate>
          <label className="st-rsvp-f"><span>Your name</span><input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
          <div className="st-rsvp-choices" role="radiogroup" aria-label="Will you come?">
            {CHOICES.map((c) => (
              <button type="button" key={c.v} role="radio" aria-checked={attending === c.v} className={attending === c.v ? "on" : ""} onClick={() => setAttending(c.v)}>{c.label}</button>
            ))}
          </div>
          {attending && attending !== "no" && (
            <label className="st-rsvp-f"><span>How many of you?</span>
              <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </label>
          )}
          <label className="st-rsvp-f"><span>A wish for the hosts <em>(optional)</em></span><textarea value={message} maxLength={280} rows={3} onChange={(e) => setMessage(e.target.value)} /></label>
          {error && <p className="st-rsvp-err" role="alert">{error}</p>}
          <button className="st-btn accent" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my reply"}</button>
        </form>
      )}
    </Section>
  );
}

/* ---------------- wishes wall ---------------- */

function Wishes({ chapter, ctx, num }: P<"wishes">) {
  const wishes = ctx.guest?.wishes ?? [];
  return (
    <Section center>
      <Head chapter={chapter} ctx={ctx} num={num} center />
      {wishes.length ? (
        <div className="st-wishes">
          {wishes.map((w, i) => (
            <figure key={i} className="st-wish" style={{ rotate: `${((i * 37) % 7) - 3}deg` }}>
              <blockquote>{w.message}</blockquote>
              <figcaption>{w.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="st-lead center">{ctx.fill(chapter.empty)}</p>
      )}
    </Section>
  );
}

export const INVITE_CHAPTERS = {
  invite: Invite,
  countdown: Countdown,
  events: Events,
  venue: Venue,
  rsvp: Rsvp,
  wishes: Wishes,
} as const;

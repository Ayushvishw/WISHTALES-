import { fillText, type Values } from "@/lib/personalization";
import type { VideoDesign, VideoScene } from "@/lib/templates/schema";

/** Every video is 9:16 portrait, the shape WhatsApp status and Instagram reels use. */
export const VIDEO_W = 720;
export const VIDEO_H = 1280;
export const FPS = 30;

/** One scene placed on the clock, with the photos it shows. */
export type Shot = { scene: VideoScene; start: number; dur: number; photos: number[]; /** Which function an "each" events screen shows. */ item?: number };
export type Timeline = { shots: Shot[]; duration: number };

const DEFAULT_SECONDS: Record<VideoScene["kind"], number> = {
  art: 5, title: 4.5, names: 5.5, photo: 4.5, gallery: 0, families: 4.5, date: 5, venue: 4.5, events: 0, message: 6, closing: 5.5,
};

/** "Haldi | Friday, 10 am | Poolside lawns" lines, at most 6, map links dropped. */
export function eventLines(values: Values): { name: string; when: string; where: string }[] {
  return (values.events ?? "")
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((p) => p[0])
    .slice(0, 6)
    .map(([name, when = "", where = ""]) => ({ name, when, where: /^https?:/i.test(where) ? "" : where }));
}

/** Lays the design's scenes out in time, skipping any whose content the customer left out. */
export function buildTimeline(video: VideoDesign, values: Values, photoCount: number): Timeline {
  const shots: Shot[] = [];
  let t = 0;
  const add = (scene: VideoScene, dur: number, photos: number[] = [], item?: number) => {
    shots.push({ scene, start: t, dur, photos, item });
    t += dur;
  };
  for (const s of video.scenes) {
    const secs = ("seconds" in s && s.seconds) || DEFAULT_SECONDS[s.kind];
    switch (s.kind) {
      case "photo":
        if (s.photo < photoCount) add(s, secs, [s.photo]);
        break;
      case "gallery": {
        const ps = Array.from({ length: Math.max(0, photoCount - s.from) }, (_, i) => s.from + i).slice(0, 6);
        if (ps.length) add(s, ps.length * (s.perPhoto ?? 2.8) + 0.6, ps);
        break;
      }
      case "families":
        if ((values.families ?? "").trim()) add(s, secs);
        break;
      case "events": {
        const n = eventLines(values).length;
        if (s.each) for (let i = 0; i < n; i++) add(s, s.perEvent ?? 4.5, [], i);
        else if (n) add(s, 2.4 + n * 1.3);
        break;
      }
      case "message":
        if ((values[s.field] ?? "").trim()) add(s, secs);
        break;
      case "venue":
        if ((values.venue_name ?? "").trim()) add(s, secs);
        break;
      case "date":
        if (/^\d{4}-\d{2}-\d{2}$/.test(values.event_date ?? "")) add(s, secs);
        break;
      case "names":
        if (fillText(s.first, values)) add(s, secs);
        break;
      default:
        add(s, secs);
    }
  }
  return { shots, duration: Math.round(t * 100) / 100 };
}

/** The shot playing at time t (the last one holds at the very end). */
export function shotAt(tl: Timeline, t: number): Shot | undefined {
  return tl.shots.find((s) => t >= s.start && t < s.start + s.dur) ?? tl.shots[tl.shots.length - 1];
}

/** "2026-11-26" → its parts, read as a calendar date (no time zone shifts). */
export function dateParts(ymd: string) {
  const d = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...o }).format(d);
  return { weekday: f({ weekday: "long" }), day: f({ day: "numeric" }), month: f({ month: "long" }), year: f({ year: "numeric" }) };
}

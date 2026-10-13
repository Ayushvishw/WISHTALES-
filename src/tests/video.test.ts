import { describe, expect, it } from "vitest";
import { resolveValues } from "@/lib/personalization";
import { sampleFor } from "@/lib/sample";
import { CATALOG } from "@/lib/templates/catalog";
import { templateConfigSchema } from "@/lib/templates/schema";
import { buildTimeline, dateParts, eventLines, shotAt } from "@/video/timeline";

const videos = CATALOG.filter((t) => t.layout === "video");
const shahi = videos.find((t) => t.slug === "vid-shahi-vivah")!;

describe("video invitations", () => {
  it("ships video designs as invitations, each with its own look", () => {
    expect(videos.length).toBeGreaterThanOrEqual(6);
    expect(videos.every((t) => t.occasion === "invitations" && t.photos.min === 0)).toBe(true);
    expect(new Set(videos.map((t) => `${t.video!.ornament}-${t.theme.bg}`)).size).toBe(videos.length);
  });

  it("gives every function its own screen and skips what the customer left out", () => {
    const full = resolveValues(shahi, sampleFor("invitations", shahi.slug));
    const tl = buildTimeline(shahi.video!, full, 6);
    const events = tl.shots.filter((s) => s.scene.kind === "events");
    expect(events.map((s) => s.item)).toEqual([0, 1, 2, 3, 4]);
    expect(tl.shots.find((s) => s.scene.kind === "gallery")!.photos).toEqual([0, 1, 2, 3]);

    const bare = buildTimeline(shahi.video!, { ...full, events: "", families: "" }, 0);
    expect(bare.shots.map((s) => s.scene.kind)).not.toContain("events");
    expect(bare.shots.map((s) => s.scene.kind)).not.toContain("gallery");
    expect(bare.shots.map((s) => s.scene.kind)).not.toContain("families");
    expect(bare.duration).toBeLessThan(tl.duration);
  });

  it("places shots back to back and finds the one playing", () => {
    const tl = buildTimeline(shahi.video!, resolveValues(shahi, sampleFor("invitations", shahi.slug)), 2);
    tl.shots.forEach((s, i) => i && expect(s.start).toBeCloseTo(tl.shots[i - 1].start + tl.shots[i - 1].dur));
    expect(shotAt(tl, 0)).toBe(tl.shots[0]);
    expect(shotAt(tl, tl.duration + 5)).toBe(tl.shots[tl.shots.length - 1]);
    expect(tl.duration).toBeGreaterThan(20);
    expect(tl.duration).toBeLessThan(90);
  });

  it("reads functions and dates the way customers write them", () => {
    expect(eventLines({ events: "Haldi | Fri 10 am | Lawns | https://maps.app.goo.gl/x\n\nSangeet | Fri 8 pm" })).toEqual([
      { name: "Haldi", when: "Fri 10 am", where: "Lawns" },
      { name: "Sangeet", when: "Fri 8 pm", where: "" },
    ]);
    expect(dateParts("2026-12-12")).toEqual({ weekday: "Saturday", day: "12", month: "December", year: "2026" });
    expect(dateParts("2026-12-12", "hi")?.month).toBe("दिसंबर");
    expect(dateParts("nope")).toBeNull();
  });

  it("rejects a video scene that reads an unknown field", () => {
    const bad = { ...shahi, video: { ...shahi.video!, scenes: [...shahi.video!.scenes, { kind: "message", field: "nope" }] } };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
});

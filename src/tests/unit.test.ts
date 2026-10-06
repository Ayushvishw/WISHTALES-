import { describe, expect, it } from "vitest";
import { mediaContentType, sniffAudio, songTitle } from "@/lib/audio-files";
import { canTransition } from "@/lib/orders/state";
import { fillText, resolveValues, sanitizeValues, validatePhotoCount, validateValues } from "@/lib/personalization";
import { CATALOG, RETIRED_TEMPLATES } from "@/lib/templates/catalog";
import { templateConfigSchema } from "@/lib/templates/schema";
import { isToken, randomToken } from "@/lib/tokens";
import { hmacHex } from "@/lib/payments/provider";
import { MockProvider } from "@/lib/payments/mock";

const candle = CATALOG.find((t) => t.slug === "bday-candlelight")!;
const story = CATALOG.find((t) => t.slug === "bday-starlit-love")!;

describe("template catalog", () => {
  it("has ten story Birthday templates plus the three retired classics", () => {
    expect(CATALOG.filter((t) => t.occasion === "birthday" && t.layout === "story")).toHaveLength(10);
    expect(RETIRED_TEMPLATES).toHaveLength(3);
    expect(new Set(CATALOG.map((t) => t.slug)).size).toBe(CATALOG.length);
  });
  it("has five Anniversary and five Love & Proposal templates, mixing swipe and scroll stories", () => {
    for (const occ of ["anniversary", "proposal"]) {
      const list = CATALOG.filter((t) => t.occasion === occ);
      expect(list).toHaveLength(5);
      const flows = new Set(list.map((t) => t.story?.flow));
      expect(flows.has("swipe") && flows.has("scroll")).toBe(true);
      expect(new Set(list.map((t) => t.story?.skin)).size).toBe(5);
    }
  });
  it("fills the proposal question from the customer's field, or its default", () => {
    const t = CATALOG.find((x) => x.slug === "prop-the-question")!;
    const q = t.story!.chapters.find((c) => c.type === "question")!;
    expect(fillText(q.title, resolveValues(t, { recipient_name: "Lisa", sender_name: "Andrew" }))).toBe("Will you marry me?");
    expect(fillText(q.title, resolveValues(t, { big_question: "Will you move in with me?" }))).toBe("Will you move in with me?");
  });
  it("rejects a story chapter that uses an unknown field", () => {
    const bad = { ...story, story: { ...story.story!, chapters: [...story.story!.chapters, { type: "letter", eyebrow: "x", title: "y", style: "envelope", field: "nope" }] } };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a slide puzzle that points at an optional photo slot", () => {
    const bad = { ...story, story: { ...story.story!, chapters: [...story.story!.chapters, { type: "slide", eyebrow: "x", title: "y", photo: 7, solved: "a", solvedSub: "b" }] } };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a story template with no story", () => {
    expect(templateConfigSchema.safeParse({ ...story, story: undefined }).success).toBe(false);
  });
  it("rejects a puzzle that points at an optional photo slot", () => {
    const bad = { ...candle, scenes: [{ id: "p", type: "puzzle", puzzle: "match", photos: [7], title: "x", hint: "y" }] };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a template without recipient_name", () => {
    const bad = { ...candle, fields: candle.fields.filter((f) => f.key !== "recipient_name") };
    expect(templateConfigSchema.safeParse(bad).success).toBe(false);
  });
});

describe("personalization", () => {
  it("requires required fields and enforces limits", () => {
    const e = validateValues(candle, { recipient_name: "", sender_name: "A".repeat(31), age: "200", message: "hi", secret_line: "s" });
    expect(Object.keys(e).sort()).toEqual(["age", "recipient_name", "sender_name"]);
  });
  it("accepts a complete set of values", () => {
    expect(validateValues(candle, { recipient_name: "Riya", sender_name: "Aarav", message: "Hi", secret_line: "Goa" })).toEqual({});
  });
  it("drops keys the template doesn't define and strips control characters", () => {
    const v = sanitizeValues(candle, { recipient_name: " Ri\u0000ya ", evil: "<script>", message: "a\r\nb" });
    expect(v).toEqual({ recipient_name: "Riya", message: "a\nb" });
  });
  it("applies defaults to empty optional fields", () => {
    expect(resolveValues(candle, {}).closing_line).toMatch(/won't face/);
  });
  it("fills placeholders and drops empty ones with their separator", () => {
    expect(fillText("From {{sender_name}}, {{relationship}}", { sender_name: "Aarav" })).toBe("From Aarav");
    expect(fillText("From {{sender_name}}, {{relationship}}", { sender_name: "Aarav", relationship: "your friend" })).toBe("From Aarav, your friend");
  });
  it("checks the photo count", () => {
    expect(validatePhotoCount(candle, 5)).toMatch(/at least 6/);
    expect(validatePhotoCount(candle, 6)).toBeNull();
    expect(validatePhotoCount(candle, 9)).toMatch(/up to 8/);
  });
});

describe("order states", () => {
  it("only allows the documented lifecycle", () => {
    expect(canTransition("DRAFT", "PAID")).toBe(false);
    expect(canTransition("PAYMENT_PENDING", "PAID")).toBe(true);
    expect(canTransition("PAID", "PROCESSING")).toBe(true);
    expect(canTransition("ACTIVE", "DRAFT")).toBe(false);
  });
});

describe("tokens", () => {
  it("are 22 characters, unambiguous and unique", () => {
    const set = new Set(Array.from({ length: 2000 }, () => randomToken()));
    expect(set.size).toBe(2000);
    for (const t of set) expect(isToken(t)).toBe(true);
    expect([...set].join("")).not.toMatch(/[0O1lI]/);
  });
});

describe("webhook signatures", () => {
  it("rejects a tampered body", () => {
    const p = new MockProvider();
    const signed = MockProvider.sign({ type: "payment.captured", providerOrderId: "o1", amountMinor: 100 });
    expect(p.parseWebhook(signed.body, new Headers(signed.headers)).kind).toBe("payment.captured");
    const tampered = signed.body.replace('"amount":100', '"amount":1');
    expect(() => p.parseWebhook(tampered, new Headers(signed.headers))).toThrow();
    expect(hmacHex("k", "a")).not.toBe(hmacHex("k", "b"));
  });
});

describe("song files", () => {
  const pad = (head: number[] | string) => Buffer.concat([typeof head === "string" ? Buffer.from(head, "latin1") : Buffer.from(head), Buffer.alloc(16)]);
  it("detects formats from bytes", () => {
    expect(sniffAudio(pad("ID3\x03"))?.ext).toBe("mp3");
    expect(sniffAudio(pad([0xff, 0xfb, 0x90, 0x00]))?.ext).toBe("mp3");
    expect(sniffAudio(pad([0xff, 0xf1, 0x50, 0x80]))?.ext).toBe("aac");
    expect(sniffAudio(pad("\x00\x00\x00\x20ftypM4A "))?.ext).toBe("m4a");
    expect(sniffAudio(pad("OggS"))?.ext).toBe("ogg");
    expect(sniffAudio(pad("RIFF\x00\x00\x00\x00WAVE"))?.ext).toBe("wav");
    expect(sniffAudio(pad("\x00\x00\x00\x20ftypqt  "))).toBeNull();
    expect(sniffAudio(pad("<html>"))).toBeNull();
    expect(sniffAudio(pad([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });
  it("cleans titles and maps content types", () => {
    expect(songTitle("my_song<script>.mp3")).toBe("my songscript");
    expect(songTitle(".mp3")).toBe("Your song");
    expect(mediaContentType("songs/abc.m4a")).toBe("audio/mp4");
    expect(mediaContentType("photos/abc.webp")).toBe("image/webp");
  });
});

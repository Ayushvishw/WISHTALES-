import { rm } from "node:fs/promises";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { seed } from "@/db/seed";
import {
  addPhoto, addSong, applyWebhook, getPreviewExperience, removeSong, createDraft, getDraft, getPublicExperience, removePhoto, reorderPhotos, startCheckout, updateDraft, UserError,
} from "@/lib/orders/service";
import type { WebhookEvent } from "@/lib/payments/provider";

const jpeg = (n: number) =>
  sharp({ create: { width: 900 + n, height: 1200, channels: 3, background: { r: 20 * n, g: 120, b: 200 } } })
    .withMetadata({ exif: { IFD0: { Copyright: "secret-location" } } })
    .jpeg()
    .toBuffer();

const values = { recipient_name: "Riya", sender_name: "Aarav", letter: "Happy birthday" };

async function readyDraft() {
  const key = await createDraft("bday-starlit-love");
  await updateDraft(key, { values });
  for (let i = 0; i < 6; i++) await addPhoto(key, await jpeg(i), "image/jpeg");
  return key;
}

const captured = (providerOrderId: string, amountMinor: number, eventId = "evt_" + Math.random()): WebhookEvent => ({
  kind: "payment.captured", eventId, providerOrderId, providerPaymentId: "pay_1", amountMinor,
});

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "./drizzle" });
  await seed();
});
afterAll(() => rm(".data/test-uploads", { recursive: true, force: true }));

describe("draft lifecycle", () => {
  it("stays DRAFT until values and photos are complete", async () => {
    const key = await createDraft("bday-starlit-love");
    expect(await updateDraft(key, { values })).toBe("DRAFT");
    for (let i = 0; i < 3; i++) await addPhoto(key, await jpeg(i), "image/jpeg");
    expect((await getDraft(key))!.state).toBe("DRAFT");
    await addPhoto(key, await jpeg(3), "image/jpeg");
    expect((await getDraft(key))!.state).toBe("PREVIEW_READY");
    // Removing a photo makes it incomplete again.
    const d = (await getDraft(key))!;
    await removePhoto(key, d.photos[0].id);
    expect((await getDraft(key))!.state).toBe("DRAFT");
  });

  it("rejects non-images, and re-encodes photos without metadata", async () => {
    const key = await createDraft("bday-starlit-love");
    await expect(addPhoto(key, Buffer.from("<?php echo 1; ?>"), "image/jpeg")).rejects.toThrow(/readable image/);
    const p = await addPhoto(key, await jpeg(1), "image/jpeg");
    const [row] = await db.select().from(schema.media).where(eq(schema.media.id, p.id));
    expect(row.contentType).toBe("image/webp");
    expect(row.storageKey).toMatch(/^photos\/[A-Za-z0-9]+\.webp$/);
    const { storage } = await import("@/lib/storage");
    const meta = await sharp((await storage().get(row.storageKey))!).metadata();
    expect(meta.exif).toBeUndefined();
  });

  it("keeps the customer's photo order", async () => {
    const key = await readyDraft();
    const ids = (await getDraft(key))!.photos.map((p) => p.id);
    await reorderPhotos(key, [...ids].reverse());
    expect((await getDraft(key))!.photos.map((p) => p.id)).toEqual([...ids].reverse());
    await expect(reorderPhotos(key, ids.slice(1))).rejects.toBeInstanceOf(UserError);
  });

  it("caps photos at the template maximum", async () => {
    const key = await readyDraft();
    await addPhoto(key, await jpeg(7), "image/jpeg");
    await addPhoto(key, await jpeg(8), "image/jpeg");
    await expect(addPhoto(key, await jpeg(9), "image/jpeg")).rejects.toThrow(/up to 8/);
  });
});

describe("own song", () => {
  const mp3 = (n = 2000) => Buffer.concat([Buffer.from("ID3\x04\x00\x00\x00\x00\x00\x00", "latin1"), Buffer.alloc(n, 1)]);

  it("stores a song, selects it, and plays it in the experience", async () => {
    const key = await readyDraft();
    const s = await addSong(key, mp3(), "Tum Hi Ho (Official).mp3");
    expect(s.title).toBe("Tum Hi Ho (Official)");
    expect(s.url).toMatch(/^\/api\/media\/songs\/[A-Za-z0-9]+\.mp3$/);
    const d = (await getDraft(key))!;
    expect(d.musicId).toBe("mus_custom");
    expect(d.song?.url).toBe(s.url);
    expect((await getPreviewExperience(key))!.music?.source).toBe(s.url);
  });

  it("replaces an earlier song and deletes its file", async () => {
    const key = await readyDraft();
    const first = await addSong(key, mp3(), "a.mp3");
    await addSong(key, mp3(3000), "b.mp3");
    const rows = await db.select().from(schema.media).where(eq(schema.media.kind, "audio"));
    expect(rows.some((r) => first.url.endsWith(r.storageKey))).toBe(false);
    const { storage } = await import("@/lib/storage");
    expect(await storage().get(first.url.replace("/api/media/", ""))).toBeNull();
  });

  it("rejects files that aren't audio or are too big", async () => {
    const key = await readyDraft();
    await expect(addSong(key, Buffer.from("<?php echo 1; ?> padding padding"), "x.mp3")).rejects.toThrow(/couldn't read/);
    await expect(addSong(key, mp3(4 * 1024 * 1024), "big.mp3")).rejects.toThrow(/4 MB/);
    await expect(updateDraft(key, { musicId: "mus_custom" })).rejects.toThrow(/Upload your song/);
  });

  it("goes back to the template's music when the song is removed", async () => {
    const key = await readyDraft();
    await addSong(key, mp3(), "a.mp3");
    expect(await removeSong(key)).toEqual({ musicId: "mus_warm_keys" });
    const d = (await getDraft(key))!;
    expect(d.song).toBeNull();
    expect(d.musicId).toBe("mus_warm_keys");
  });
});

describe("payment and link", () => {
  it("activates exactly once on a verified capture, and ignores duplicates", async () => {
    const key = await readyDraft();
    const s = await startCheckout(key);
    expect((await getDraft(key))!.state).toBe("CHECKOUT_STARTED");
    const ev = captured(s.providerOrderId, s.amountMinor, "evt_dup");
    expect(await applyWebhook("mock", ev, {})).toBe("processed");
    expect(await applyWebhook("mock", ev, {})).toBe("duplicate");
    const d = (await getDraft(key))!;
    expect(d.state).toBe("ACTIVE");
    expect(d.linkToken).toMatch(/^[A-Za-z0-9]{22}$/);
    const links = await db.select().from(schema.publicLinks).where(eq(schema.publicLinks.token, d.linkToken!));
    expect(links).toHaveLength(1);
    // A second, different capture for the same order is flagged, not re-activated.
    expect(await applyWebhook("mock", captured(s.providerOrderId, s.amountMinor), {})).toBe("processed");
    const audits = await db.select().from(schema.auditLog).where(eq(schema.auditLog.target, d.reference));
    expect(audits.map((a) => a.action)).toContain("payment.duplicate_capture");
    await expect(updateDraft(key, { values })).rejects.toThrow(/already paid/);
  });

  it("does not activate when the amount doesn't match", async () => {
    const key = await readyDraft();
    const s = await startCheckout(key);
    await applyWebhook("mock", captured(s.providerOrderId, 1), {});
    expect((await getDraft(key))!.state).toBe("CHECKOUT_STARTED");
  });

  it("returns to PREVIEW_READY after a failed payment so the customer can retry", async () => {
    const key = await readyDraft();
    const s = await startCheckout(key);
    await applyWebhook("mock", { kind: "payment.failed", eventId: "evt_fail", providerOrderId: s.providerOrderId, providerPaymentId: "p" }, {});
    expect((await getDraft(key))!.state).toBe("PREVIEW_READY");
    const s2 = await startCheckout(key);
    await applyWebhook("mock", captured(s2.providerOrderId, s2.amountMinor), {});
    expect((await getDraft(key))!.state).toBe("ACTIVE");
  });

  it("refuses checkout for an incomplete draft", async () => {
    const key = await createDraft("bday-starlit-love");
    await expect(startCheckout(key)).rejects.toThrow(/Finish the details/);
  });

  it("serves only what the recipient needs", async () => {
    const key = await readyDraft();
    const s = await startCheckout(key);
    await applyWebhook("mock", captured(s.providerOrderId, s.amountMinor), {});
    const r = await getPublicExperience((await getDraft(key))!.linkToken!);
    expect(r.status).toBe("active");
    if (r.status !== "active") return;
    expect(Object.keys(r.experience).sort()).toEqual(["config", "music", "photos", "values"]);
    expect(r.experience.photos).toHaveLength(6);
    expect(r.experience.values.letter).toBe("Happy birthday");
    expect(r.experience.config.layout).toBe("story");
    expect(JSON.stringify(r.experience)).not.toContain(key);
    expect(await getPublicExperience("A".repeat(22))).toEqual({ status: "not_found" });
  });
});

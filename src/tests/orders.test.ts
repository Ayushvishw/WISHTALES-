import { rm } from "node:fs/promises";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { seed } from "@/db/seed";
import {
  addPhoto, addSong, applyWebhook, getPreviewExperience, getSharedPreview, sharePreview, addRsvp, listRsvps, setRsvpHidden, removeSong, createDraft, getDraft, getPublicExperience, removePhoto, reorderPhotos, startCheckout, updateDraft, UserError,
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
    await addPhoto(key, await jpeg(0), "image/jpeg");
    expect((await getDraft(key))!.state).toBe("DRAFT");
    await addPhoto(key, await jpeg(1), "image/jpeg");
    expect((await getDraft(key))!.state).toBe("PREVIEW_READY");
    // Removing a photo makes it incomplete again.
    const d = (await getDraft(key))!;
    await removePhoto(key, d.photos[0].id);
    expect((await getDraft(key))!.state).toBe("DRAFT");
  });

  it("prices the order by photo tier: 2 included, then +₹50 per 2 more", async () => {
    const key = await createDraft("bday-starlit-love"); // ₹299
    await updateDraft(key, { values });
    const amount = async () => (await getDraft(key))!.amountMinor;
    expect(await amount()).toBe(29900);
    for (let i = 0; i < 2; i++) await addPhoto(key, await jpeg(i), "image/jpeg");
    expect(await amount()).toBe(29900);
    await addPhoto(key, await jpeg(2), "image/jpeg"); // 3 photos fall in the 4-photo tier
    expect(await amount()).toBe(34900);
    for (let i = 3; i < 8; i++) await addPhoto(key, await jpeg(i), "image/jpeg");
    expect(await amount()).toBe(44900);
    const s = await startCheckout(key);
    expect(s.amountMinor).toBe(44900);
    // Back to 6 photos: the total drops, and a new checkout charges the new total.
    const d = (await getDraft(key))!;
    for (const p of d.photos.slice(0, 2)) await removePhoto(key, p.id);
    expect(await amount()).toBe(39900);
    expect((await startCheckout(key)).amountMinor).toBe(39900);
  });

  it("shares a view-only preview only while the draft is complete and unpaid", async () => {
    const draft = await createDraft("bday-starlit-love");
    await expect(sharePreview(draft)).rejects.toThrow(/Finish/);
    const key = await readyDraft();
    const token = await sharePreview(key);
    expect(await sharePreview(key)).toBe(token); // same link every time
    const r = await getSharedPreview(token);
    expect(r.status).toBe("active");
    if (r.status === "active") expect(r.experience.values.recipient_name).toBe("Riya");
    // Removing photos below the minimum hides it while editing.
    const d = (await getDraft(key))!;
    for (const p of d.photos.slice(0, 5)) await removePhoto(key, p.id);
    expect((await getSharedPreview(token)).status).toBe("editing");
    await addPhoto(key, await jpeg(9), "image/jpeg");
    // After payment the real link takes over.
    const s = await startCheckout(key);
    await applyWebhook("mock", captured(s.providerOrderId, s.amountMinor), {});
    expect((await getSharedPreview(token)).status).toBe("sent");
    await expect(sharePreview(key)).rejects.toThrow(/already paid/);
    expect((await getSharedPreview("nope")).status).toBe("not_found");
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

describe("invitations", () => {
  const invite = {
    couple_one: "Riya", couple_two: "Aarav", sender_name: "The Kapoor family", event_date: "2030-02-14", venue_name: "Lake Palace",
    events: "Wedding | Saturday 7 pm | Lake Palace", letter: "Come celebrate with us",
  };
  async function paidInvite() {
    const key = await createDraft("inv-ivory-vows");
    await updateDraft(key, { values: invite });
    for (let i = 0; i < 2; i++) await addPhoto(key, await jpeg(i), "image/jpeg");
    const s = await startCheckout(key);
    expect(s.amountMinor).toBe(59900);
    await applyWebhook("mock", captured(s.providerOrderId, s.amountMinor), {});
    return { key, token: (await getDraft(key))!.linkToken! };
  }

  it("collects replies, shows wishes on the wall and lets the host hide them", async () => {
    const { key, token } = await paidInvite();
    const r0 = await getPublicExperience(token);
    expect(r0.status === "active" && r0.experience.guestbook).toEqual({ token, wishes: [] });
    await addRsvp(token, { name: "Meera Shah", attending: "yes", guests: 3, message: "So happy for you!" });
    await addRsvp(token, { name: "Kabir", attending: "no", guests: 4 });
    await expect(addRsvp(token, { name: "", attending: "yes" })).rejects.toThrow(/name/);
    await expect(addRsvp(token, { name: "X", attending: "sure" })).rejects.toThrow(/come/);
    await expect(addRsvp(token, { name: "X", attending: "yes", guests: 50 })).rejects.toThrow(/1 to 10/);
    const list = await listRsvps(key);
    expect(list.map((r) => [r.name, r.attending, r.guests])).toEqual([["Kabir", "no", 0], ["Meera Shah", "yes", 3]]);
    let r = await getPublicExperience(token);
    expect(r.status === "active" && r.experience.guestbook!.wishes).toEqual([{ name: "Meera", message: "So happy for you!" }]);
    await setRsvpHidden(key, list[1].id, true);
    r = await getPublicExperience(token);
    expect(r.status === "active" && r.experience.guestbook!.wishes).toEqual([]);
    // Another order's key can't touch this reply.
    await expect(setRsvpHidden(await readyDraft(), list[1].id, false)).rejects.toThrow(/isn't part/);
  });

  it("doesn't take replies on previews or on wish templates", async () => {
    const key = await readyDraft(); // a birthday story, not an invitation
    const s = await startCheckout(key);
    await applyWebhook("mock", captured(s.providerOrderId, s.amountMinor), {});
    const token = (await getDraft(key))!.linkToken!;
    await expect(addRsvp(token, { name: "A", attending: "yes" })).rejects.toThrow(/isn't taking replies/);
    const draft = await createDraft("inv-party-time");
    expect((await getPreviewExperience(draft))!.guestbook).toEqual({ token: null, wishes: [] });
  });
});

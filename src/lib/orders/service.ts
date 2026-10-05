import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { processPhoto } from "@/lib/images";
import { paymentProvider } from "@/lib/payments";
import type { WebhookEvent } from "@/lib/payments/provider";
import { resolveValues, sanitizeValues, validatePhotoCount, validateValues, type FieldErrors, type Values } from "@/lib/personalization";
import { storage } from "@/lib/storage";
import type { TemplateConfig } from "@/lib/templates/schema";
import { orderReference, randomToken } from "@/lib/tokens";
import { assertTransition, EDITABLE, PAID_OR_LATER, type OrderState } from "./state";

const { orders, personalizations, media, templateVersions, templates, occasions, payments, paymentEvents, publicLinks, auditLog, musicTracks } = schema;

export class UserError extends Error {
  constructor(message: string, public status = 400, public fieldErrors?: FieldErrors) {
    super(message);
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Order = typeof orders.$inferSelect;

/* ---------------- catalog ---------------- */

export async function listOccasions() {
  return db.select().from(occasions).orderBy(asc(occasions.sort));
}

/** Latest published version of each published template for an occasion. */
export async function listTemplates(occasionSlug: string) {
  const rows = await db
    .select({ config: templateVersions.config, version: templateVersions.version, createdAt: templateVersions.createdAt })
    .from(templateVersions)
    .innerJoin(templates, eq(templates.id, templateVersions.templateId))
    .innerJoin(occasions, eq(occasions.id, templates.occasionId))
    .where(and(eq(occasions.slug, occasionSlug), eq(templates.status, "published"), eq(templateVersions.status, "published")))
    .orderBy(desc(templateVersions.createdAt));
  const seen = new Set<string>();
  return rows.filter((r) => !seen.has(r.config.slug) && seen.add(r.config.slug)).map((r) => r.config).sort((a, b) => a.priceMinor - b.priceMinor);
}

async function latestPublishedVersion(slug: string) {
  const [row] = await db
    .select({ id: templateVersions.id, config: templateVersions.config, priceMinor: templateVersions.priceMinor, currency: templateVersions.currency })
    .from(templateVersions)
    .innerJoin(templates, eq(templates.id, templateVersions.templateId))
    .where(and(eq(templates.slug, slug), eq(templates.status, "published"), eq(templateVersions.status, "published")))
    .orderBy(desc(templateVersions.createdAt))
    .limit(1);
  return row ?? null;
}

export async function listMusic() {
  return db.select().from(musicTracks).where(eq(musicTracks.status, "active"));
}

/* ---------------- drafts ---------------- */

export async function createDraft(templateSlug: string) {
  const v = await latestPublishedVersion(templateSlug);
  if (!v) throw new UserError("That template isn't available.", 404);
  const draftKey = randomToken(32);
  await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(orders)
      .values({ reference: orderReference(), draftKey, templateVersionId: v.id, amountMinor: v.priceMinor, currency: v.currency, musicId: v.config.music.default })
      .returning();
    await tx.insert(personalizations).values({ orderId: o.id, values: {} });
  });
  return draftKey;
}

export type DraftView = Awaited<ReturnType<typeof getDraft>>;

export async function getDraft(draftKey: string) {
  const [row] = await db
    .select({ order: orders, config: templateVersions.config, values: personalizations.values })
    .from(orders)
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .innerJoin(personalizations, eq(personalizations.orderId, orders.id))
    .where(eq(orders.draftKey, draftKey));
  if (!row) return null;
  const photos = await db.select().from(media).where(and(eq(media.orderId, row.order.id), eq(media.kind, "photo"))).orderBy(asc(media.position));
  const [link] = await db.select().from(publicLinks).where(eq(publicLinks.orderId, row.order.id));
  return {
    reference: row.order.reference,
    state: row.order.state,
    amountMinor: row.order.amountMinor,
    currency: row.order.currency,
    musicId: row.order.musicId,
    config: row.config,
    values: row.values,
    photos: photos.map((p) => ({ id: p.id, url: mediaUrl(p.storageKey), thumbUrl: mediaUrl(p.thumbKey ?? p.storageKey) })),
    linkToken: link?.status === "active" ? link.token : null,
    _orderId: row.order.id,
  };
}

async function requireDraft(tx: Tx, draftKey: string, lock = true) {
  const q = tx.select().from(orders).where(eq(orders.draftKey, draftKey));
  const [o] = lock ? await q.for("update") : await q;
  if (!o) throw new UserError("We couldn't find that draft.", 404);
  return o;
}

async function setState(tx: Tx, o: Order, to: OrderState, extra: Partial<Order> = {}) {
  if (o.state === to) return o;
  assertTransition(o.state, to);
  const [n] = await tx.update(orders).set({ state: to, updatedAt: new Date(), ...extra }).where(eq(orders.id, o.id)).returning();
  return n;
}

/** Recomputes DRAFT vs PREVIEW_READY after any edit. */
async function refreshReadiness(tx: Tx, o: Order) {
  const [cfgRow] = await tx.select({ config: templateVersions.config }).from(templateVersions).where(eq(templateVersions.id, o.templateVersionId));
  const [p] = await tx.select({ values: personalizations.values }).from(personalizations).where(eq(personalizations.orderId, o.id));
  const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(media).where(and(eq(media.orderId, o.id), eq(media.kind, "photo")));
  const ready = !Object.keys(validateValues(cfgRow.config, p.values)).length && !validatePhotoCount(cfgRow.config, count);
  return setState(tx, o, ready ? "PREVIEW_READY" : "DRAFT");
}

function assertEditable(o: Order) {
  if (!EDITABLE.includes(o.state)) throw new UserError("This order is already paid, so it can't be edited.", 409);
}

export async function updateDraft(draftKey: string, input: { values?: Record<string, unknown>; musicId?: string }) {
  return db.transaction(async (tx) => {
    let o = await requireDraft(tx, draftKey);
    assertEditable(o);
    const [cfgRow] = await tx.select({ config: templateVersions.config }).from(templateVersions).where(eq(templateVersions.id, o.templateVersionId));
    if (input.values) {
      const values = sanitizeValues(cfgRow.config, input.values);
      await tx.update(personalizations).set({ values, updatedAt: new Date() }).where(eq(personalizations.orderId, o.id));
    }
    if (input.musicId) {
      const [m] = await tx.select().from(musicTracks).where(and(eq(musicTracks.id, input.musicId), eq(musicTracks.status, "active")));
      if (!m) throw new UserError("That music isn't available.");
      [o] = await tx.update(orders).set({ musicId: m.id, updatedAt: new Date() }).where(eq(orders.id, o.id)).returning();
    }
    o = await refreshReadiness(tx, o);
    return o.state;
  });
}

export async function addPhoto(draftKey: string, file: Buffer, type: string) {
  // Process outside the transaction: it is slow and needs no lock.
  const img = await processPhoto(file, type);
  const key = `photos/${randomToken(24)}.webp`;
  const thumbKey = `thumbs/${randomToken(24)}.webp`;
  await storage().put(key, img.full, "image/webp");
  await storage().put(thumbKey, img.thumb, "image/webp");
  try {
    return await db.transaction(async (tx) => {
      const o = await requireDraft(tx, draftKey);
      assertEditable(o);
      const [cfgRow] = await tx.select({ config: templateVersions.config }).from(templateVersions).where(eq(templateVersions.id, o.templateVersionId));
      const existing = await tx.select({ position: media.position }).from(media).where(and(eq(media.orderId, o.id), eq(media.kind, "photo")));
      if (existing.length >= cfgRow.config.photos.max) throw new UserError(`This template takes up to ${cfgRow.config.photos.max} photos.`);
      const position = existing.reduce((m, r) => Math.max(m, r.position), -1) + 1;
      const [row] = await tx
        .insert(media)
        .values({ orderId: o.id, kind: "photo", storageKey: key, thumbKey, position, width: img.width, height: img.height, bytes: img.full.byteLength, contentType: "image/webp" })
        .returning();
      await refreshReadiness(tx, o);
      return { id: row.id, url: mediaUrl(key), thumbUrl: mediaUrl(thumbKey) };
    });
  } catch (e) {
    await storage().delete(key);
    await storage().delete(thumbKey);
    throw e;
  }
}

export async function removePhoto(draftKey: string, photoId: string) {
  const removed = await db.transaction(async (tx) => {
    const o = await requireDraft(tx, draftKey);
    assertEditable(o);
    const [row] = await tx.delete(media).where(and(eq(media.id, photoId), eq(media.orderId, o.id))).returning();
    if (!row) throw new UserError("That photo isn't part of this draft.", 404);
    await refreshReadiness(tx, o);
    return row;
  });
  await storage().delete(removed.storageKey);
  if (removed.thumbKey) await storage().delete(removed.thumbKey);
}

/** Sets photo order. `ids` must list exactly the draft's photos. */
export async function reorderPhotos(draftKey: string, ids: string[]) {
  await db.transaction(async (tx) => {
    const o = await requireDraft(tx, draftKey);
    assertEditable(o);
    const rows = await tx.select({ id: media.id }).from(media).where(and(eq(media.orderId, o.id), eq(media.kind, "photo")));
    const have = new Set(rows.map((r) => r.id));
    if (ids.length !== have.size || !ids.every((id) => have.has(id)) || new Set(ids).size !== ids.length) {
      throw new UserError("The photo order doesn't match this draft.");
    }
    for (const [i, id] of ids.entries()) await tx.update(media).set({ position: i }).where(eq(media.id, id));
  });
}

/* ---------------- checkout + payment ---------------- */

export async function startCheckout(draftKey: string) {
  const provider = paymentProvider();
  const o = await db.transaction(async (tx) => {
    let o = await requireDraft(tx, draftKey);
    if (PAID_OR_LATER.includes(o.state)) throw new UserError("This order is already paid.", 409);
    o = await refreshReadiness(tx, o);
    if (o.state !== "PREVIEW_READY") throw new UserError("Finish the details and photos before paying.", 422);
    return setState(tx, o, "CHECKOUT_STARTED");
  });
  const session = await provider.createCheckout({ reference: o.reference, amountMinor: o.amountMinor, currency: o.currency });
  await db.insert(payments).values({ orderId: o.id, provider: session.provider, providerOrderId: session.providerOrderId, amountMinor: o.amountMinor, currency: o.currency });
  return { ...session, reference: o.reference, amountMinor: o.amountMinor, currency: o.currency };
}

/** The browser says the customer finished the provider's checkout. Not proof of payment. */
export async function markPaymentSubmitted(draftKey: string) {
  return db.transaction(async (tx) => {
    const o = await requireDraft(tx, draftKey);
    if (o.state === "CHECKOUT_STARTED") return (await setState(tx, o, "PAYMENT_PENDING")).state;
    return o.state;
  });
}

export type WebhookResult = "processed" | "duplicate" | "ignored" | "unknown_order";

/**
 * Applies a verified webhook exactly once. The event id is recorded in the
 * same transaction as its effects, so a retried or duplicated delivery is a no-op.
 */
export async function applyWebhook(provider: string, event: WebhookEvent, payload: unknown): Promise<WebhookResult> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(paymentEvents)
      .values({ provider, eventId: event.eventId, type: event.kind === "ignored" ? event.type : event.kind, payload: payload as object })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) return "duplicate";
    if (event.kind === "ignored") return "ignored";

    const [pay] = await tx.select().from(payments).where(and(eq(payments.provider, provider), eq(payments.providerOrderId, event.providerOrderId))).for("update");
    if (!pay) return "unknown_order";
    let [o] = await tx.select().from(orders).where(eq(orders.id, pay.orderId)).for("update");

    if (event.kind === "payment.failed") {
      await tx.update(payments).set({ status: "failed", providerPaymentId: event.providerPaymentId, updatedAt: new Date() }).where(eq(payments.id, pay.id));
      if (o.state === "CHECKOUT_STARTED" || o.state === "PAYMENT_PENDING") await setState(tx, o, "PREVIEW_READY");
      return "processed";
    }

    // payment.captured
    if (event.amountMinor !== pay.amountMinor) {
      await tx.insert(auditLog).values({ actor: "system", action: "payment.amount_mismatch", target: o.reference, details: { expected: pay.amountMinor, got: event.amountMinor } });
      return "processed";
    }
    await tx.update(payments).set({ status: "captured", providerPaymentId: event.providerPaymentId, updatedAt: new Date() }).where(eq(payments.id, pay.id));
    if (PAID_OR_LATER.includes(o.state)) {
      // A second successful payment for an already-paid order: keep one experience, flag for refund.
      await tx.insert(auditLog).values({ actor: "system", action: "payment.duplicate_capture", target: o.reference, details: { providerPaymentId: event.providerPaymentId } });
      return "processed";
    }
    if (o.state === "DRAFT" || o.state === "CANCELLED" || o.state === "REFUNDED") {
      // Paid while the draft was incomplete or closed. Don't publish; support refunds or fixes it.
      await tx.insert(auditLog).values({ actor: "system", action: "payment.order_not_ready", target: o.reference, details: { state: o.state } });
      return "processed";
    }
    if (o.state === "PREVIEW_READY") o = await setState(tx, o, "CHECKOUT_STARTED"); // payment window was reopened after a failure
    o = await setState(tx, o, "PAID", { paidAt: new Date() });
    o = await setState(tx, o, "PROCESSING");
    // Photos are optimized at upload, so processing is just publishing the link.
    await tx.insert(publicLinks).values({ orderId: o.id, token: randomToken(22) }).onConflictDoNothing();
    await setState(tx, o, "ACTIVE", { activatedAt: new Date() });
    return "processed";
  });
}

/* ---------------- public experience ---------------- */

export type PublicExperience = {
  config: TemplateConfig;
  values: Values;
  photos: string[];
  music: { source: string } | null;
};

/** Only what the recipient's page needs. No ids, prices, contact details or order data. */
export async function getPublicExperience(token: string): Promise<{ status: "active"; experience: PublicExperience } | { status: "expired" | "unavailable" | "not_found" }> {
  const [row] = await db
    .select({ link: publicLinks, order: orders, config: templateVersions.config, values: personalizations.values })
    .from(publicLinks)
    .innerJoin(orders, eq(orders.id, publicLinks.orderId))
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .innerJoin(personalizations, eq(personalizations.orderId, orders.id))
    .where(eq(publicLinks.token, token));
  if (!row) return { status: "not_found" };
  if (row.link.status === "expired" || row.order.state === "EXPIRED" || (row.link.expiresAt && row.link.expiresAt < new Date())) return { status: "expired" };
  if (row.link.status !== "active" || row.order.state !== "ACTIVE") return { status: "unavailable" };
  return { status: "active", experience: await buildExperience(row.order, row.config, row.values) };
}

/** Same shape for the creator's preview, so preview and paid experience render identically. */
export async function getPreviewExperience(draftKey: string): Promise<PublicExperience | null> {
  const [row] = await db
    .select({ order: orders, config: templateVersions.config, values: personalizations.values })
    .from(orders)
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .innerJoin(personalizations, eq(personalizations.orderId, orders.id))
    .where(eq(orders.draftKey, draftKey));
  if (!row) return null;
  return buildExperience(row.order, row.config, row.values);
}

async function buildExperience(o: Order, config: TemplateConfig, values: Values): Promise<PublicExperience> {
  const photos = await db.select({ key: media.storageKey }).from(media).where(and(eq(media.orderId, o.id), eq(media.kind, "photo"))).orderBy(asc(media.position));
  let music: PublicExperience["music"] = null;
  if (o.musicId) {
    const [m] = await db.select().from(musicTracks).where(inArray(musicTracks.id, [o.musicId]));
    if (m && m.source !== "none") music = { source: m.source.startsWith("builtin:") ? m.source : mediaUrl(m.source) };
  }
  return { config, values: resolveValues(config, values), photos: photos.map((p) => mediaUrl(p.key)), music };
}

export const mediaUrl = (key: string) => `/api/media/${key}`;

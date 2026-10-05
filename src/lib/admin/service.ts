import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { mediaUrl, UserError } from "@/lib/orders/service";
import { assertTransition, ORDER_STATES, PAID_OR_LATER, type OrderState } from "@/lib/orders/state";
import { templateConfigSchema, type TemplateConfig } from "@/lib/templates/schema";
import { audit, hashPassword, passwordProblem, ROLES, type Admin, type Role } from "./auth";

const { orders, personalizations, media, templateVersions, templates, occasions, payments, publicLinks, auditLog, musicTracks, adminUsers, analyticsEvents } = schema;

/* ---------------- dashboard ---------------- */

export async function dashboard() {
  const byState = await db.select({ state: orders.state, n: count() }).from(orders).groupBy(orders.state);
  const [rev] = await db.select({ total: sum(orders.amountMinor) }).from(orders).where(inArray(orders.state, PAID_OR_LATER));
  const since = new Date(Date.now() - 30 * 864e5);
  const funnel = await db
    .select({ name: analyticsEvents.name, n: count() })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.at, since))
    .groupBy(analyticsEvents.name);
  const recent = await searchOrders({ limit: 8 });
  return {
    byState: Object.fromEntries(byState.map((r) => [r.state, r.n])) as Partial<Record<OrderState, number>>,
    revenueMinor: Number(rev?.total ?? 0),
    funnel: Object.fromEntries(funnel.map((r) => [r.name, r.n])) as Record<string, number>,
    recent,
  };
}

/* ---------------- orders ---------------- */

export async function searchOrders({ q, state, limit = 50 }: { q?: string; state?: string; limit?: number }) {
  const conds = [];
  const term = q?.trim();
  if (term) {
    // Reference, share-link token, or the recipient's name.
    conds.push(
      or(
        ilike(orders.reference, `%${term.replace(/[%_]/g, "")}%`),
        eq(publicLinks.token, term.replace(/^.*\/w\//, "")),
        ilike(sql`${personalizations.values}->>'recipient_name'`, `%${term.replace(/[%_]/g, "")}%`),
      ),
    );
  }
  if (state && (ORDER_STATES as readonly string[]).includes(state)) conds.push(eq(orders.state, state as OrderState));
  return db
    .select({
      reference: orders.reference,
      state: orders.state,
      amountMinor: orders.amountMinor,
      createdAt: orders.createdAt,
      template: sql<string>`${templateVersions.config}->>'name'`,
      recipient: sql<string | null>`${personalizations.values}->>'recipient_name'`,
      sender: sql<string | null>`${personalizations.values}->>'sender_name'`,
      linkStatus: publicLinks.status,
    })
    .from(orders)
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .innerJoin(personalizations, eq(personalizations.orderId, orders.id))
    .leftJoin(publicLinks, eq(publicLinks.orderId, orders.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function orderDetail(reference: string) {
  const [row] = await db
    .select({ order: orders, config: templateVersions.config, values: personalizations.values, link: publicLinks })
    .from(orders)
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .innerJoin(personalizations, eq(personalizations.orderId, orders.id))
    .leftJoin(publicLinks, eq(publicLinks.orderId, orders.id))
    .where(eq(orders.reference, reference));
  if (!row) return null;
  const photos = await db.select().from(media).where(eq(media.orderId, row.order.id)).orderBy(asc(media.position));
  const pays = await db.select().from(payments).where(eq(payments.orderId, row.order.id)).orderBy(desc(payments.createdAt));
  const history = await db.select().from(auditLog).where(eq(auditLog.target, reference)).orderBy(desc(auditLog.at)).limit(50);
  return {
    order: row.order,
    templateName: row.config.name,
    templateVersion: row.config.version,
    fields: row.config.fields,
    values: row.values,
    photos: photos.map((p) => ({ id: p.id, thumbUrl: mediaUrl(p.thumbKey ?? p.storageKey), url: mediaUrl(p.storageKey) })),
    payments: pays,
    link: row.link,
    history,
  };
}

async function orderByRef(reference: string) {
  const [o] = await db.select().from(orders).where(eq(orders.reference, reference));
  if (!o) throw new UserError("Order not found.", 404);
  return o;
}

export async function setLinkStatus(admin: Admin, reference: string, status: "active" | "disabled") {
  const o = await orderByRef(reference);
  if (status === "active" && o.state !== "ACTIVE") throw new UserError("Only an active, paid order can have its link switched on.");
  const [l] = await db.update(publicLinks).set({ status }).where(eq(publicLinks.orderId, o.id)).returning();
  if (!l) throw new UserError("This order doesn't have a link yet.");
  await audit(admin, status === "active" ? "link.enabled" : "link.disabled", reference);
}

/**
 * Records a refund made in the payment provider's dashboard: the order becomes
 * REFUNDED and its link stops working. It doesn't move money by itself.
 */
export async function markRefunded(admin: Admin, reference: string, note: string) {
  await db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.reference, reference)).for("update");
    if (!o) throw new UserError("Order not found.", 404);
    assertTransition(o.state, "REFUNDED");
    await tx.update(orders).set({ state: "REFUNDED", updatedAt: new Date() }).where(eq(orders.id, o.id));
    await tx.update(publicLinks).set({ status: "disabled" }).where(eq(publicLinks.orderId, o.id));
    await tx.update(payments).set({ status: "refunded", updatedAt: new Date() }).where(and(eq(payments.orderId, o.id), eq(payments.status, "captured")));
  });
  await audit(admin, "order.refunded", reference, { note: note.slice(0, 500) });
}

/* ---------------- templates ---------------- */

export async function listTemplatesAdmin() {
  const rows = await db
    .select({ template: templates, occasion: occasions.name })
    .from(templates)
    .innerJoin(occasions, eq(occasions.id, templates.occasionId))
    .orderBy(asc(occasions.sort), asc(templates.slug));
  const versions = await db
    .select({ templateId: templateVersions.templateId, version: templateVersions.version, status: templateVersions.status, priceMinor: templateVersions.priceMinor, createdAt: templateVersions.createdAt })
    .from(templateVersions)
    .orderBy(desc(templateVersions.createdAt));
  const sold = await db.select({ templateId: templateVersions.templateId, n: count() }).from(orders)
    .innerJoin(templateVersions, eq(templateVersions.id, orders.templateVersionId))
    .where(inArray(orders.state, PAID_OR_LATER)).groupBy(templateVersions.templateId);
  return rows.map((r) => {
    const vs = versions.filter((v) => v.templateId === r.template.id);
    return {
      ...r.template,
      occasion: r.occasion,
      live: vs.find((v) => v.status === "published") ?? null,
      versions: vs.length,
      sold: sold.find((s) => s.templateId === r.template.id)?.n ?? 0,
    };
  });
}

export async function templateDetail(slug: string) {
  const [t] = await db.select().from(templates).where(eq(templates.slug, slug));
  if (!t) return null;
  const versions = await db
    .select({ id: templateVersions.id, version: templateVersions.version, status: templateVersions.status, priceMinor: templateVersions.priceMinor, createdAt: templateVersions.createdAt, publishedAt: templateVersions.publishedAt, config: templateVersions.config })
    .from(templateVersions)
    .where(eq(templateVersions.templateId, t.id))
    .orderBy(desc(templateVersions.createdAt));
  const usage = await db.select({ id: orders.templateVersionId, n: count() }).from(orders).where(inArray(orders.templateVersionId, versions.map((v) => v.id).concat("00000000-0000-0000-0000-000000000000"))).groupBy(orders.templateVersionId);
  return { template: t, versions: versions.map((v) => ({ ...v, orders: usage.find((u) => u.id === v.id)?.n ?? 0 })) };
}

export async function setTemplateStatus(admin: Admin, slug: string, status: "published" | "unpublished") {
  const [t] = await db.update(templates).set({ status }).where(eq(templates.slug, slug)).returning();
  if (!t) throw new UserError("Template not found.", 404);
  await audit(admin, `template.${status}`, slug);
}

/** Publishing a version unpublishes the others, so customers always get exactly one. Existing orders keep their own version. */
export async function setVersionStatus(admin: Admin, slug: string, version: string, status: "published" | "unpublished") {
  await db.transaction(async (tx) => {
    const [t] = await tx.select().from(templates).where(eq(templates.slug, slug));
    if (!t) throw new UserError("Template not found.", 404);
    if (status === "published") {
      await tx.update(templateVersions).set({ status: "unpublished" }).where(and(eq(templateVersions.templateId, t.id), eq(templateVersions.status, "published")));
    }
    const [v] = await tx
      .update(templateVersions)
      .set({ status, ...(status === "published" ? { publishedAt: new Date() } : {}) })
      .where(and(eq(templateVersions.templateId, t.id), eq(templateVersions.version, version)))
      .returning();
    if (!v) throw new UserError("Version not found.", 404);
  });
  await audit(admin, `template_version.${status}`, slug, { version });
}

const semver = (v: string) => v.split(".").map(Number);
export function isNewer(a: string, b: string) {
  const [x, y] = [semver(a), semver(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
export function bumpPatch(v: string) {
  const [a, b, c] = semver(v);
  return `${a}.${b}.${c + 1}`;
}

/**
 * Adds a new version from a JSON config. Published versions are never
 * edited; changes always arrive as a new, higher version.
 */
export async function createVersion(admin: Admin, slug: string, json: string, publish: boolean) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new UserError(`The JSON isn't valid: ${(e as Error).message}`);
  }
  const r = templateConfigSchema.safeParse(parsed);
  if (!r.success) throw new UserError("The template has problems: " + r.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "template"}: ${i.message}`).join("; "));
  const config: TemplateConfig = r.data;
  const detail = await templateDetail(slug);
  if (!detail) throw new UserError("Template not found.", 404);
  if (config.slug !== slug) throw new UserError(`The slug must stay "${slug}".`);
  const latest = detail.versions[0]?.version ?? "0.0.0";
  if (!isNewer(config.version, latest)) throw new UserError(`The version must be higher than ${latest}.`);
  await db.insert(templateVersions).values({ templateId: detail.template.id, version: config.version, config, priceMinor: config.priceMinor, currency: config.currency, status: "draft" });
  await audit(admin, "template_version.created", slug, { version: config.version });
  if (publish) await setVersionStatus(admin, slug, config.version, "published");
  return config.version;
}

/** The common case: change the price. Creates and publishes a patch version with the new price. */
export async function changePrice(admin: Admin, slug: string, rupees: number) {
  if (!Number.isFinite(rupees) || rupees < 1 || rupees > 100000) throw new UserError("Enter a price between ₹1 and ₹1,00,000.");
  const detail = await templateDetail(slug);
  if (!detail?.versions.length) throw new UserError("Template not found.", 404);
  const base = detail.versions.find((v) => v.status === "published") ?? detail.versions[0];
  const next = { ...base.config, version: bumpPatch(detail.versions[0].version), priceMinor: Math.round(rupees * 100) };
  return createVersion(admin, slug, JSON.stringify(next), true);
}

/* ---------------- occasions + music ---------------- */

export const listOccasionsAdmin = () => db.select().from(occasions).orderBy(asc(occasions.sort));

export async function setOccasionStatus(admin: Admin, slug: string, status: "live" | "coming_soon" | "hidden") {
  const [o] = await db.update(occasions).set({ status }).where(eq(occasions.slug, slug)).returning();
  if (!o) throw new UserError("Occasion not found.", 404);
  await audit(admin, "occasion.status", slug, { status });
}

export const listMusicAdmin = () => db.select().from(musicTracks).orderBy(asc(musicTracks.title));

export async function setMusicStatus(admin: Admin, id: string, status: "active" | "retired") {
  const [m] = await db.update(musicTracks).set({ status }).where(eq(musicTracks.id, id)).returning();
  if (!m) throw new UserError("Track not found.", 404);
  await audit(admin, "music.status", id, { status });
}

/* ---------------- users + audit ---------------- */

export const listAdmins = () => db.select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role, createdAt: adminUsers.createdAt }).from(adminUsers).orderBy(asc(adminUsers.createdAt));

export async function createAdmin(actor: Admin | string, email: string, role: Role, password: string) {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new UserError("Enter a valid email address.");
  if (!ROLES.includes(role)) throw new UserError("Choose a role.");
  const problem = passwordProblem(password);
  if (problem) throw new UserError(problem);
  const [exists] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, e));
  if (exists) throw new UserError("That email already has an account.");
  const [u] = await db.insert(adminUsers).values({ email: e, role, passwordHash: await hashPassword(password) }).returning();
  await audit(actor, "admin.created", e, { role });
  return u;
}

export async function removeAdmin(actor: Admin, id: string) {
  if (id === actor.id) throw new UserError("You can't remove your own account.");
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  if (!u) throw new UserError("Account not found.", 404);
  if (u.role === "owner") {
    const [{ n }] = await db.select({ n: count() }).from(adminUsers).where(eq(adminUsers.role, "owner"));
    if (n <= 1) throw new UserError("Keep at least one owner.");
  }
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  await audit(actor, "admin.removed", u.email);
}

export const listAudit = (limit = 200) => db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(limit);

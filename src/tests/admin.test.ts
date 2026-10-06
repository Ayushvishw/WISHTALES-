import { rm } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Admin auth reads cookies through next/headers, which only exists inside a request.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error("redirect " + to); } }));

import { db, schema } from "@/db";
import { seed } from "@/db/seed";
import { can, hashPassword, verifyPassword, type Admin } from "@/lib/admin/auth";
import {
  changePrice, createAdmin, createVersion, isNewer, markRefunded, removeAdmin, searchOrders, setLinkStatus, setVersionStatus, templateDetail,
} from "@/lib/admin/service";
import { addPhoto, applyWebhook, createDraft, getDraft, getPublicExperience, startCheckout, updateDraft } from "@/lib/orders/service";

let owner: Admin;
const photo = (n: number) => sharp({ create: { width: 600, height: 800, channels: 3, background: { r: n * 30, g: 90, b: 160 } } }).jpeg().toBuffer();

async function paidOrder() {
  const key = await createDraft("bday-candy-land");
  await updateDraft(key, { values: { recipient_name: "Meera", sender_name: "Kabir", letter: "Hi", wishes: "a\nb\nc", treats: "a\nb\nc" } });
  for (let i = 0; i < 6; i++) await addPhoto(key, await photo(i), "image/jpeg");
  const s = await startCheckout(key);
  await applyWebhook("mock", { kind: "payment.captured", eventId: "e" + Math.random(), providerOrderId: s.providerOrderId, providerPaymentId: "p", amountMinor: s.amountMinor }, {});
  return (await getDraft(key))!;
}

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "./drizzle" });
  await seed();
  const u = await createAdmin("test", "owner@example.com", "owner", "correct horse battery");
  owner = { id: u.id, email: u.email, role: "owner" };
});
afterAll(() => rm(".data/test-uploads", { recursive: true, force: true }));

describe("admin accounts", () => {
  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("a long enough password");
    expect(h).toMatch(/^scrypt\$/);
    expect(await verifyPassword("a long enough password", h)).toBe(true);
    expect(await verifyPassword("wrong password here", h)).toBe(false);
  });
  it("enforces roles", () => {
    expect(can("support", "orders.manage")).toBe(true);
    expect(can("support", "templates.manage")).toBe(false);
    expect(can("editor", "users.manage")).toBe(false);
  });
  it("rejects short passwords and duplicate emails, and keeps one owner", async () => {
    await expect(createAdmin(owner, "x@example.com", "support", "short")).rejects.toThrow(/12 characters/);
    await expect(createAdmin(owner, "OWNER@example.com", "support", "another long password")).rejects.toThrow(/already/);
    await expect(removeAdmin(owner, owner.id)).rejects.toThrow(/own account/);
    const other = await createAdmin(owner, "second@example.com", "owner", "another long password");
    await removeAdmin({ ...owner, id: other.id }, owner.id);
    await expect(removeAdmin({ ...owner, id: "00000000-0000-0000-0000-000000000000" }, other.id)).rejects.toThrow(/at least one owner/);
  });
});

describe("templates", () => {
  it("changes price through a new version without touching existing orders", async () => {
    const before = await paidOrder();
    const v = await changePrice(owner, "bday-candy-land", 349);
    expect(v).toBe("2.2.1");
    const d = (await templateDetail("bday-candy-land"))!;
    expect(d.versions.filter((x) => x.status === "published").map((x) => x.version)).toEqual(["2.2.1"]);
    const [paid] = await db.select().from(schema.orders).where(eq(schema.orders.id, before._orderId));
    expect(paid.amountMinor).toBe(19900);
    const key = await createDraft("bday-candy-land");
    expect((await getDraft(key))!.amountMinor).toBe(34900);
    // The paid experience still renders from its own version.
    expect((await getPublicExperience(before.linkToken!)).status).toBe("active");
  });

  it("validates new versions before saving", async () => {
    const d = (await templateDetail("bday-starlit-love"))!;
    const cfg = d.versions[0].config;
    await expect(createVersion(owner, "bday-starlit-love", "{not json", false)).rejects.toThrow(/isn't valid/);
    await expect(createVersion(owner, "bday-starlit-love", JSON.stringify(cfg), false)).rejects.toThrow(/higher than/);
    await expect(createVersion(owner, "bday-starlit-love", JSON.stringify({ ...cfg, version: "2.3.0", slug: "other" }), false)).rejects.toThrow(/slug/);
    await expect(createVersion(owner, "bday-starlit-love", JSON.stringify({ ...cfg, version: "2.3.0", story: undefined }), false)).rejects.toThrow(/problems/);
    expect(await createVersion(owner, "bday-starlit-love", JSON.stringify({ ...cfg, version: "2.3.0", name: "Starlit Deluxe" }), false)).toBe("2.3.0");
    // Saved as a draft: customers still get 2.2.0 until it's published.
    let k = await createDraft("bday-starlit-love");
    expect((await getDraft(k))!.config.version).toBe("2.2.0");
    await setVersionStatus(owner, "bday-starlit-love", "2.3.0", "published");
    k = await createDraft("bday-starlit-love");
    expect((await getDraft(k))!.config.name).toBe("Starlit Deluxe");
  });

  it("compares versions numerically", () => {
    expect(isNewer("1.0.10", "1.0.9")).toBe(true);
    expect(isNewer("1.0.0", "1.0.0")).toBe(false);
  });
});

describe("orders", () => {
  it("finds orders by reference, link or recipient name", async () => {
    const o = await paidOrder();
    expect((await searchOrders({ q: o.reference })).map((r) => r.reference)).toContain(o.reference);
    expect((await searchOrders({ q: `https://x.test/w/${o.linkToken}` })).map((r) => r.reference)).toEqual([o.reference]);
    expect((await searchOrders({ q: "meer" })).length).toBeGreaterThan(0);
    expect((await searchOrders({ state: "ACTIVE" })).every((r) => r.state === "ACTIVE")).toBe(true);
  });

  it("switches a link off and on", async () => {
    const o = await paidOrder();
    await setLinkStatus(owner, o.reference, "disabled");
    expect((await getPublicExperience(o.linkToken!)).status).toBe("unavailable");
    await setLinkStatus(owner, o.reference, "active");
    expect((await getPublicExperience(o.linkToken!)).status).toBe("active");
  });

  it("records a refund and closes the link", async () => {
    const o = await paidOrder();
    await markRefunded(owner, o.reference, "test");
    expect((await getPublicExperience(o.linkToken!)).status).toBe("unavailable");
    await expect(setLinkStatus(owner, o.reference, "active")).rejects.toThrow(/Only an active/);
    await expect(markRefunded(owner, o.reference, "again")).rejects.toThrow();
  });
});

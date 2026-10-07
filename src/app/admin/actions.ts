"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, createSession, endSession, hasAnyAdmin, requireAdmin, verifyPassword, type Permission, type Role } from "@/lib/admin/auth";
import {
  changePhotoPrices, changePrice, createAdmin, createVersion, markRefunded, removeAdmin, setLinkStatus, setMusicStatus, setOccasionStatus, setTemplateStatus, setVersionStatus,
} from "@/lib/admin/service";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/http";
import { UserError } from "@/lib/orders/service";
import { InvalidTransitionError } from "@/lib/orders/state";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");

/** Runs an admin mutation, then returns to `path` with a notice or an error message in the URL. */
async function run(path: string, perm: Permission, fn: (admin: Awaited<ReturnType<typeof requireAdmin>>) => Promise<string>) {
  const admin = await requireAdmin();
  let to: string;
  try {
    await requireAdmin(perm);
    const notice = await fn(admin);
    to = `${path}?notice=${encodeURIComponent(notice)}`;
  } catch (e) {
    const msg = e instanceof UserError || e instanceof InvalidTransitionError || (e instanceof Error && e.message.startsWith("You don't have"))
      ? e.message
      : "Something went wrong. Please try again.";
    if (!(e instanceof UserError)) console.error(e);
    to = `${path}?error=${encodeURIComponent(msg)}`;
  }
  revalidatePath("/admin", "layout");
  redirect(to);
}

/* ---------- sign in ---------- */

export async function login(_: unknown, f: FormData): Promise<{ error?: string; email?: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!rateLimit("admin-login:" + ip, 10, 15 * 60_000)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  const email = s(f, "email").trim().toLowerCase();
  const [u] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
  // Always run the hash so a wrong email takes as long as a wrong password.
  const ok = await verifyPassword(s(f, "password"), u?.passwordHash ?? "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
  if (!u || !ok) return { error: "That email and password don't match.", email };
  await createSession(u.id);
  await audit(u.email, "admin.signed_in");
  redirect("/admin");
}

/** First run only: creates the owner account. Needs ADMIN_SETUP_CODE from the server settings. */
export async function setupOwner(_: unknown, f: FormData): Promise<{ error?: string; email?: string }> {
  if (await hasAnyAdmin()) return { error: "An owner already exists. Sign in instead." };
  const code = process.env.ADMIN_SETUP_CODE;
  if (!code) return { error: "Set ADMIN_SETUP_CODE in the server settings first." };
  if (s(f, "code") !== code) return { error: "That setup code isn't right.", email: s(f, "email") };
  try {
    const u = await createAdmin("setup", s(f, "email"), "owner", s(f, "password"));
    await createSession(u.id);
  } catch (e) {
    return { error: e instanceof UserError ? e.message : "Couldn't create the account.", email: s(f, "email") };
  }
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- orders ---------- */

export async function disableLink(f: FormData) {
  const ref = s(f, "reference");
  await run(`/admin/orders/${ref}`, "orders.manage", async (a) => { await setLinkStatus(a, ref, "disabled"); return "Link switched off. The recipient now sees a 'not available' page."; });
}
export async function enableLink(f: FormData) {
  const ref = s(f, "reference");
  await run(`/admin/orders/${ref}`, "orders.manage", async (a) => { await setLinkStatus(a, ref, "active"); return "Link switched back on."; });
}
export async function refund(f: FormData) {
  const ref = s(f, "reference");
  await run(`/admin/orders/${ref}`, "orders.manage", async (a) => { await markRefunded(a, ref, s(f, "note")); return "Marked as refunded and the link is off. Make sure the refund is also issued in Razorpay."; });
}

/* ---------- templates ---------- */

export async function price(f: FormData) {
  const slug = s(f, "slug");
  await run(`/admin/templates/${slug}`, "templates.manage", async (a) => `New price is live as version ${await changePrice(a, slug, Number(s(f, "rupees")))}.`);
}
export async function photoPrices(f: FormData) {
  const slug = s(f, "slug");
  const adds = f.getAll("add").map((v) => Number(v));
  await run(`/admin/templates/${slug}`, "templates.manage", async (a) => `New photo prices are live as version ${await changePhotoPrices(a, slug, adds)}.`);
}
export async function newVersion(f: FormData) {
  const slug = s(f, "slug");
  await run(`/admin/templates/${slug}`, "templates.manage", async (a) => {
    const v = await createVersion(a, slug, s(f, "config"), f.get("publish") === "on");
    return f.get("publish") === "on" ? `Version ${v} is live.` : `Version ${v} saved as a draft.`;
  });
}
export async function versionStatus(f: FormData) {
  const slug = s(f, "slug");
  const status = s(f, "status") === "published" ? "published" : "unpublished";
  await run(`/admin/templates/${slug}`, "templates.manage", async (a) => { await setVersionStatus(a, slug, s(f, "version"), status); return status === "published" ? `Version ${s(f, "version")} is live.` : `Version ${s(f, "version")} is no longer offered.`; });
}
export async function templateStatus(f: FormData) {
  const slug = s(f, "slug");
  const status = s(f, "status") === "published" ? "published" : "unpublished";
  await run(`/admin/templates/${slug}`, "templates.manage", async (a) => { await setTemplateStatus(a, slug, status); return status === "published" ? "Template is visible to customers." : "Template is hidden from customers. Existing links keep working."; });
}

/* ---------- catalog ---------- */

export async function occasionStatus(f: FormData) {
  const v = s(f, "status");
  const status = v === "live" || v === "hidden" ? v : "coming_soon";
  await run("/admin/catalog", "catalog.manage", async (a) => { await setOccasionStatus(a, s(f, "slug"), status); return "Occasion updated."; });
}
export async function musicStatus(f: FormData) {
  const status = s(f, "status") === "active" ? "active" : "retired";
  await run("/admin/catalog", "catalog.manage", async (a) => { await setMusicStatus(a, s(f, "id"), status); return "Music updated."; });
}

/* ---------- team ---------- */

export async function addAdmin(f: FormData) {
  await run("/admin/team", "users.manage", async (a) => { await createAdmin(a, s(f, "email"), s(f, "role") as Role, s(f, "password")); return "Account created. Share the password with them privately."; });
}
export async function deleteAdmin(f: FormData) {
  await run("/admin/team", "users.manage", async (a) => { await removeAdmin(a, s(f, "id")); return "Account removed."; });
}

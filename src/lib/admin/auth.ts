import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;
const { adminUsers, adminSessions, auditLog } = schema;

export const ROLES = ["owner", "editor", "support"] as const;
export type Role = (typeof ROLES)[number];

/** What each role may do. Owners can do everything. */
const PERMS = {
  "orders.view": ["owner", "editor", "support"],
  "orders.manage": ["owner", "support"],
  "templates.manage": ["owner", "editor"],
  "catalog.manage": ["owner", "editor"],
  "users.manage": ["owner"],
  "audit.view": ["owner"],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof PERMS;
export const can = (role: Role, p: Permission) => (PERMS[p] as readonly Role[]).includes(role);

export const COOKIE = "wt_admin";
const SESSION_DAYS = 7;
const N = 16384;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw.normalize("NFKC"), salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, n, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const got = await scrypt(pw.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: 8, p: 1 });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Use at least 12 characters.";
  if (pw.length > 200) return "Use at most 200 characters.";
  return null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(adminSessions).values({ tokenHash: sha256(token), userId, expiresAt });
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)));
  jar.delete({ name: COOKIE, path: "/admin" });
}

export type Admin = { id: string; email: string; role: Role };

export async function currentAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, new Date())));
  return row ?? null;
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(p?: Permission): Promise<Admin> {
  const a = await currentAdmin();
  if (!a) redirect("/admin/login");
  if (p && !can(a.role, p)) throw new Error("You don't have permission to do that.");
  return a;
}

export async function hasAnyAdmin() {
  const [{ n }] = await db.select({ n: count() }).from(adminUsers);
  return n > 0;
}

export async function audit(actor: Admin | string, action: string, target?: string, details?: Record<string, unknown>) {
  await db.insert(auditLog).values({ actor: typeof actor === "string" ? actor : actor.email, action, target, details });
}

import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/http";

/** Section 21 events. Only known names, a template slug and a random visit id are stored. */
export async function POST(req: Request) {
  if (!rateLimit("events:" + clientIp(req), 120, 60_000)) return new Response(null, { status: 204 });
  const b = (await req.json().catch(() => ({}))) as { name?: string; template?: string; visit?: string };
  if (!b.name || !(ANALYTICS_EVENTS as readonly string[]).includes(b.name)) return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  await db.insert(schema.analyticsEvents).values({
    name: b.name,
    templateSlug: typeof b.template === "string" && /^[a-z0-9-]{1,60}$/.test(b.template) ? b.template : null,
    visitId: typeof b.visit === "string" && /^[A-Za-z0-9]{1,32}$/.test(b.visit) ? b.visit : null,
  });
  return new Response(null, { status: 204 });
}

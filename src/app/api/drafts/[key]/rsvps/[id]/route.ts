import { NextResponse } from "next/server";
import { setRsvpHidden, UserError } from "@/lib/orders/service";
import { handle } from "@/lib/http";

/** The host hides a wish from the public wall, or shows it again. */
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ key: string; id: string }> }) => {
  const { key, id } = await params;
  const body = (await req.json().catch(() => ({}))) as { hidden?: unknown };
  if (typeof body.hidden !== "boolean") throw new UserError("Send hidden: true or false.");
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new UserError("That reply isn't part of this order.", 404);
  await setRsvpHidden(key, id, body.hidden);
  return NextResponse.json({ ok: true });
});

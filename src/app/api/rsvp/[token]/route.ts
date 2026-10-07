import { NextResponse } from "next/server";
import { addRsvp, UserError } from "@/lib/orders/service";
import { clientIp, handle, rateLimit, tooMany } from "@/lib/http";
import { isToken } from "@/lib/tokens";

/** A guest replies to an invitation. Public, so rate limited per visitor and per invitation. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  if (!isToken(token)) throw new UserError("This invitation isn't taking replies.", 404);
  if (!rateLimit("rsvp:" + clientIp(req), 10, 10 * 60_000) || !rateLimit("rsvp-link:" + token, 300, 60 * 60_000)) return tooMany();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(await addRsvp(token, body), { status: 201 });
});

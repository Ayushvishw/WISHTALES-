import { NextResponse } from "next/server";
import { startCheckout } from "@/lib/orders/service";
import { clientIp, handle, rateLimit, tooMany } from "@/lib/http";

export const POST = handle(async (req: Request, { params }: { params: Promise<{ key: string }> }) => {
  if (!rateLimit("checkout:" + clientIp(req), 20, 10 * 60_000)) return tooMany();
  const session = await startCheckout((await params).key);
  return NextResponse.json(session);
});

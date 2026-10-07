import { NextResponse } from "next/server";
import { sharePreview } from "@/lib/orders/service";
import { clientIp, handle, rateLimit, tooMany } from "@/lib/http";
import { appUrl } from "@/lib/url";

export const POST = handle(async (req: Request, { params }: { params: Promise<{ key: string }> }) => {
  if (!rateLimit("share-preview:" + clientIp(req), 30, 10 * 60_000)) return tooMany();
  const token = await sharePreview((await params).key);
  return NextResponse.json({ url: `${appUrl()}/p/${token}` });
});

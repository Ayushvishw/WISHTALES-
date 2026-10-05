import { NextResponse } from "next/server";
import { removePhoto } from "@/lib/orders/service";
import { handle } from "@/lib/http";

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ key: string; photoId: string }> }) => {
  const { key, photoId } = await params;
  await removePhoto(key, photoId);
  return NextResponse.json({ ok: true });
});

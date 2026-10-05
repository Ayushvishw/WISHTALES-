import { NextResponse } from "next/server";
import { addPhoto, reorderPhotos, UserError } from "@/lib/orders/service";
import { IMAGE_RULES } from "@/lib/images";
import { clientIp, handle, rateLimit, tooMany } from "@/lib/http";

type Ctx = { params: Promise<{ key: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  if (!rateLimit("upload:" + clientIp(req), 40, 10 * 60_000)) return tooMany();
  const len = Number(req.headers.get("content-length") || 0);
  if (len > IMAGE_RULES.maxBytes + 64 * 1024) throw new UserError("Each photo must be 10 MB or smaller.", 413);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new UserError("Choose a photo to upload.");
  const photo = await addPhoto((await params).key, Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json(photo, { status: 201 });
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  if (!Array.isArray(body.ids) || !body.ids.every((x) => typeof x === "string")) throw new UserError("Send the photo ids in order.");
  await reorderPhotos((await params).key, body.ids as string[]);
  return NextResponse.json({ ok: true });
});

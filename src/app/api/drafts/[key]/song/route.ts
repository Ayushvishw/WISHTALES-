import { NextResponse } from "next/server";
import { SONG_RULES } from "@/lib/audio-files";
import { addSong, removeSong, UserError } from "@/lib/orders/service";
import { clientIp, handle, rateLimit, tooMany } from "@/lib/http";

type Ctx = { params: Promise<{ key: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  if (!rateLimit("song:" + clientIp(req), 15, 10 * 60_000)) return tooMany();
  const len = Number(req.headers.get("content-length") || 0);
  if (len > SONG_RULES.maxBytes + 64 * 1024) throw new UserError("Songs must be 4 MB or smaller. Try an MP3 of about 4 minutes or less.", 413);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new UserError("Choose a song to upload.");
  const song = await addSong((await params).key, Buffer.from(await file.arrayBuffer()), file.name);
  return NextResponse.json(song, { status: 201 });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  return NextResponse.json(await removeSong((await params).key));
});

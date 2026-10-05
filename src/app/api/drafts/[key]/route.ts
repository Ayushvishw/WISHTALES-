import { NextResponse } from "next/server";
import { getDraft, updateDraft, UserError } from "@/lib/orders/service";
import { handle } from "@/lib/http";

type Ctx = { params: Promise<{ key: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const d = await getDraft((await params).key);
  if (!d) throw new UserError("We couldn't find that draft.", 404);
  return NextResponse.json({ state: d.state, linkToken: d.linkToken });
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const body = (await req.json().catch(() => ({}))) as { values?: Record<string, unknown>; musicId?: string };
  const values = body.values && typeof body.values === "object" ? body.values : undefined;
  const musicId = typeof body.musicId === "string" ? body.musicId : undefined;
  const state = await updateDraft((await params).key, { values, musicId });
  return NextResponse.json({ state });
});

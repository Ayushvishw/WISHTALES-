import { assertKey, storage } from "@/lib/storage";
import { clientIp, rateLimit, tooMany } from "@/lib/http";

/** Serves optimized media by random key. Originals are never stored, and keys can't be guessed. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!rateLimit("media:" + clientIp(req), 600, 60_000)) return tooMany();
  const key = (await params).key.join("/");
  try {
    assertKey(key);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const body = await storage().get(key);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": key.endsWith(".webp") ? "image/webp" : "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}

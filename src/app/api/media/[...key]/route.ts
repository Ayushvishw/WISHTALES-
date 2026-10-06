import { mediaContentType } from "@/lib/audio-files";
import { assertKey, storage } from "@/lib/storage";
import { clientIp, rateLimit, tooMany } from "@/lib/http";

/**
 * Serves media by random key. Photos are re-encoded at upload and originals are
 * never stored; songs are stored as uploaded after a format check. Keys can't
 * be guessed. Byte ranges are supported because Safari won't play audio without them.
 */
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
  const headers: Record<string, string> = {
    "content-type": mediaContentType(key),
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "content-disposition": "inline",
    "accept-ranges": "bytes",
  };
  const size = body.byteLength;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start: number, end: number;
    if (range[1]) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    } else {
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    }
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(new Uint8Array(body.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(body), { headers: { ...headers, "content-length": String(size) } });
}

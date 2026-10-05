import { NextResponse } from "next/server";
import { UserError } from "@/lib/orders/service";
import { InvalidTransitionError } from "@/lib/orders/state";
import { ImageError } from "@/lib/images";

/** Wraps a route handler: known errors become clear JSON messages, everything else is logged as a 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof UserError) return NextResponse.json({ error: e.message, fieldErrors: e.fieldErrors }, { status: e.status });
      if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 422 });
      if (e instanceof InvalidTransitionError) return NextResponse.json({ error: "This order can't do that right now." }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
    }
  };
}

/** Fixed-window rate limit per key. In-memory, so per instance; use a shared store (e.g. Redis) when running several instances. */
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 50_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return true;
  }
  h.n++;
  return h.n <= limit;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export const tooMany = () => NextResponse.json({ error: "Too many requests. Wait a moment and try again." }, { status: 429 });

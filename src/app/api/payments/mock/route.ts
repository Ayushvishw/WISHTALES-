import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { handle } from "@/lib/http";
import { isMockPayments } from "@/lib/payments";
import { MockProvider } from "@/lib/payments/mock";
import { UserError } from "@/lib/orders/service";

/**
 * Development only: plays the role of the payment provider. It sends a signed
 * webhook to our real webhook endpoint, so the full verification path runs.
 */
export const POST = handle(async (req: Request) => {
  if (!isMockPayments()) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const { draftKey, outcome } = (await req.json()) as { draftKey: string; outcome: "success" | "failure" };
  const [row] = await db
    .select({ providerOrderId: schema.payments.providerOrderId, amountMinor: schema.payments.amountMinor })
    .from(schema.payments)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
    .where(and(eq(schema.orders.draftKey, draftKey), eq(schema.payments.status, "created"), eq(schema.payments.provider, "mock")))
    .orderBy(desc(schema.payments.createdAt))
    .limit(1);
  if (!row) throw new UserError("Start checkout first.", 409);
  const signed = MockProvider.sign({ type: outcome === "success" ? "payment.captured" : "payment.failed", ...row });
  const res = await fetch(new URL("/api/payments/webhook", req.url), { method: "POST", headers: { "content-type": "application/json", ...signed.headers }, body: signed.body });
  return NextResponse.json(await res.json(), { status: res.status });
});

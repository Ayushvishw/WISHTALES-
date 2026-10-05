import { NextResponse } from "next/server";
import { markPaymentSubmitted } from "@/lib/orders/service";
import { handle } from "@/lib/http";

/** Called when the browser returns from checkout. Only moves the order to PAYMENT_PENDING; the webhook decides PAID. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ key: string }> }) => {
  const state = await markPaymentSubmitted((await params).key);
  return NextResponse.json({ state });
});

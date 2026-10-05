import { NextResponse } from "next/server";
import { applyWebhook } from "@/lib/orders/service";
import { paymentProvider } from "@/lib/payments";
import { WebhookSignatureError } from "@/lib/payments/provider";

/**
 * Payment provider webhook. The signature is checked against the raw body,
 * then the event is applied exactly once. Returning 2xx for duplicates stops
 * the provider from retrying; a 500 makes it retry later.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const provider = paymentProvider();
  let event;
  try {
    event = provider.parseWebhook(raw, req.headers);
  } catch (e) {
    if (e instanceof WebhookSignatureError || e instanceof SyntaxError) return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    throw e;
  }
  try {
    const result = await applyWebhook(provider.name, event, JSON.parse(raw));
    return NextResponse.json({ result });
  } catch (e) {
    console.error("Webhook processing failed", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

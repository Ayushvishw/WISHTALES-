import { hmacHex, safeEqualHex, WebhookSignatureError, type PaymentProvider, type WebhookEvent } from "./provider";

type RzpPayment = { id: string; order_id: string; amount: number; status: string };
type RzpWebhook = { event: string; payload?: { payment?: { entity?: RzpPayment } } };

/** Razorpay Orders API + webhooks. Docs: https://razorpay.com/docs/webhooks/ */
export class RazorpayProvider implements PaymentProvider {
  name = "razorpay";
  constructor(private keyId: string, private keySecret: string, private webhookSecret: string) {}

  async createCheckout(o: { reference: string; amountMinor: number; currency: string }) {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64"),
      },
      body: JSON.stringify({ amount: o.amountMinor, currency: o.currency, receipt: o.reference }),
    });
    if (!res.ok) throw new Error(`Razorpay order creation failed with status ${res.status}`);
    const body = (await res.json()) as { id: string };
    return {
      provider: this.name,
      providerOrderId: body.id,
      client: { key: this.keyId, order_id: body.id, amount: o.amountMinor, currency: o.currency, name: "Wish Tale" },
    };
  }

  parseWebhook(rawBody: string, headers: Headers): WebhookEvent {
    const sig = headers.get("x-razorpay-signature") ?? "";
    if (!safeEqualHex(hmacHex(this.webhookSecret, rawBody), sig)) throw new WebhookSignatureError("Bad signature");
    const eventId = headers.get("x-razorpay-event-id") ?? "";
    if (!eventId) throw new WebhookSignatureError("Missing event id");
    const body = JSON.parse(rawBody) as RzpWebhook;
    const p = body.payload?.payment?.entity;
    if (body.event === "payment.captured" && p) {
      return { kind: "payment.captured", eventId, providerOrderId: p.order_id, providerPaymentId: p.id, amountMinor: p.amount };
    }
    if (body.event === "payment.failed" && p) {
      return { kind: "payment.failed", eventId, providerOrderId: p.order_id, providerPaymentId: p.id };
    }
    return { kind: "ignored", eventId, type: body.event };
  }
}

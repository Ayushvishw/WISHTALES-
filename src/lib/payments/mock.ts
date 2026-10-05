import { randomToken } from "../tokens";
import { hmacHex, safeEqualHex, WebhookSignatureError, type PaymentProvider, type WebhookEvent } from "./provider";

/**
 * Development-only provider. Its "checkout" is a page in this app that posts a
 * signed webhook back to /api/payments/webhook, so payments in development go
 * through exactly the same verification and idempotency code as production.
 */
export const MOCK_SECRET = process.env.MOCK_PAYMENT_SECRET ?? "dev-only-mock-secret";

export class MockProvider implements PaymentProvider {
  name = "mock";

  async createCheckout() {
    const providerOrderId = "mock_order_" + randomToken(14);
    return { provider: this.name, providerOrderId, client: { mock: 1, order_id: providerOrderId } };
  }

  /** Builds a signed webhook request body, as the real provider would send it. */
  static sign(event: { type: "payment.captured" | "payment.failed"; providerOrderId: string; amountMinor: number }) {
    const body = JSON.stringify({
      event: event.type,
      payload: { payment: { entity: { id: "mock_pay_" + randomToken(12), order_id: event.providerOrderId, amount: event.amountMinor } } },
    });
    return { body, headers: { "x-mock-signature": hmacHex(MOCK_SECRET, body), "x-mock-event-id": "mock_evt_" + randomToken(16) } };
  }

  parseWebhook(rawBody: string, headers: Headers): WebhookEvent {
    if (!safeEqualHex(hmacHex(MOCK_SECRET, rawBody), headers.get("x-mock-signature") ?? "")) {
      throw new WebhookSignatureError("Bad signature");
    }
    const eventId = headers.get("x-mock-event-id") ?? "";
    const b = JSON.parse(rawBody) as { event: string; payload: { payment: { entity: { id: string; order_id: string; amount: number } } } };
    const p = b.payload.payment.entity;
    if (b.event === "payment.captured") return { kind: "payment.captured", eventId, providerOrderId: p.order_id, providerPaymentId: p.id, amountMinor: p.amount };
    if (b.event === "payment.failed") return { kind: "payment.failed", eventId, providerOrderId: p.order_id, providerPaymentId: p.id };
    return { kind: "ignored", eventId, type: b.event };
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Payment providers create a provider-side order for checkout and verify
 * webhooks. An order only becomes PAID through a verified webhook; the
 * browser's return from checkout is never treated as proof of payment.
 */
export type CheckoutSession = {
  provider: string;
  providerOrderId: string;
  /** Data the browser needs to open the provider's checkout. */
  client: Record<string, string | number>;
};

export type WebhookEvent =
  | { kind: "payment.captured"; eventId: string; providerOrderId: string; providerPaymentId: string; amountMinor: number }
  | { kind: "payment.failed"; eventId: string; providerOrderId: string; providerPaymentId: string }
  | { kind: "ignored"; eventId: string; type: string };

export interface PaymentProvider {
  name: string;
  createCheckout(o: { reference: string; amountMinor: number; currency: string }): Promise<CheckoutSession>;
  /** Throws if the signature is invalid. */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent;
}

export function hmacHex(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}

export class WebhookSignatureError extends Error {}

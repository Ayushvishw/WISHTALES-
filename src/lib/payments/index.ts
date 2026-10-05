import { MockProvider } from "./mock";
import type { PaymentProvider } from "./provider";
import { RazorpayProvider } from "./razorpay";

let instance: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (instance) return instance;
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_WEBHOOK_SECRET) {
    instance = new RazorpayProvider(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET);
  } else {
    // Demo mode: with no Razorpay keys, payment is simulated and every page says so.
    instance = new MockProvider();
  }
  return instance;
}

export const isMockPayments = () => paymentProvider().name === "mock";

/** True when the site takes no real payments. Shown as a banner on every page. */
export const isDemoMode = isMockPayments;

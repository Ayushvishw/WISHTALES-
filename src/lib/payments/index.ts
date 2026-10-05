import { MockProvider } from "./mock";
import type { PaymentProvider } from "./provider";
import { RazorpayProvider } from "./razorpay";

let instance: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (instance) return instance;
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_WEBHOOK_SECRET) {
    instance = new RazorpayProvider(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET);
  } else if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MOCK_PAYMENTS) {
    throw new Error("Razorpay is not configured. Set the RAZORPAY_* variables.");
  } else {
    instance = new MockProvider();
  }
  return instance;
}

export const isMockPayments = () => paymentProvider().name === "mock";

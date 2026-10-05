/** Order lifecycle from section 13 of the requirements. */
export const ORDER_STATES = [
  "DRAFT",
  "PREVIEW_READY",
  "CHECKOUT_STARTED",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "ACTIVE",
  "EXPIRED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

const TRANSITIONS: Record<OrderState, OrderState[]> = {
  // Editing a ready draft sends it back to DRAFT until it validates again.
  DRAFT: ["PREVIEW_READY", "CANCELLED"],
  PREVIEW_READY: ["DRAFT", "CHECKOUT_STARTED", "CANCELLED"],
  // The verified webhook can arrive before the browser reports back, so CHECKOUT_STARTED may go straight to PAID.
  CHECKOUT_STARTED: ["DRAFT", "PREVIEW_READY", "PAYMENT_PENDING", "PAID", "CANCELLED"],
  // A failed payment returns the order to PREVIEW_READY so the customer keeps their draft and can retry.
  // Reopening checkout (for example after closing the payment window) goes back to CHECKOUT_STARTED.
  PAYMENT_PENDING: ["PAID", "PREVIEW_READY", "CHECKOUT_STARTED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["ACTIVE", "REFUNDED"],
  ACTIVE: ["EXPIRED", "REFUNDED", "CANCELLED"],
  EXPIRED: ["ACTIVE"],
  REFUNDED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(public from: OrderState, public to: OrderState) {
    super(`Order cannot move from ${from} to ${to}`);
  }
}

export function assertTransition(from: OrderState, to: OrderState): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

/** States in which the customer may still edit names, photos and music. */
export const EDITABLE: OrderState[] = ["DRAFT", "PREVIEW_READY", "CHECKOUT_STARTED"];

/** States at or past successful payment. */
export const PAID_OR_LATER: OrderState[] = ["PAID", "PROCESSING", "ACTIVE", "EXPIRED"];

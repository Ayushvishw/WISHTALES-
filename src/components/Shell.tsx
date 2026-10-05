import Link from "next/link";
import type { OrderState } from "@/lib/orders/state";

const STEPS = ["Template", "Personalize", "Preview", "Pay", "Share"];

/** Page frame for the customer side: brand bar plus, inside the create flow, the step bar and order state. */
export function Shell({ step, state, children }: { step?: number; state?: OrderState; children: React.ReactNode }) {
  return (
    <div className="wrap">
      <header className="bar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <b>Wish Tale</b>
        </Link>
      </header>
      {step !== undefined && (
        <div className="steps">
          {STEPS.map((n, k) => (
            <span key={n} className={`s ${k === step ? "on" : k < step ? "done" : ""}`}>
              <i>{k < step ? "✓" : k + 1}</i>
              {n}
            </span>
          ))}
          {state && <span className="state" title="Order state">Order: {state}</span>}
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}

export const inr = (minor: number) => "₹" + (minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });

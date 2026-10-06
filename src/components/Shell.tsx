import type { OrderState } from "@/lib/orders/state";
import { isDemoMode } from "@/lib/payments";
import { Footer } from "@/site/Footer";
import { Header } from "@/site/Header";

const STEPS = ["Template", "Personalize", "Preview", "Pay", "Share"];

/**
 * Page frame for the customer side: the site header and footer, plus the step
 * bar and order state inside the create flow. `home` pages run full width.
 */
export function Shell({ step, state, home, children }: { step?: number; state?: OrderState; home?: boolean; children: React.ReactNode }) {
  return (
    <div className="site">
      {isDemoMode() && <DemoBanner />}
      <Header />
      {home ? (
        <main className="home">{children}</main>
      ) : (
        <div className="wrap page">
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
      )}
      <Footer />
    </div>
  );
}

export const inr = (minor: number) => "₹" + (minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function DemoBanner() {
  return (
    <div className="demo" role="note">
      <b>Demo</b> Payments are simulated. Nothing is charged.
    </div>
  );
}

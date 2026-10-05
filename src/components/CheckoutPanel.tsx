"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { OrderState } from "@/lib/orders/state";

type Session = { provider: string; providerOrderId: string; client: Record<string, string | number> };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open(): void; on(ev: string, cb: () => void): void };

function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Checkout didn't load")));
    s.onerror = () => reject(new Error("Checkout didn't load. Check your connection and try again."));
    document.head.append(s);
  });
}

/**
 * Starts checkout, then waits for the server to confirm payment. The page never
 * decides an order is paid; it polls the order state that the webhook sets.
 */
export function CheckoutPanel({ draftKey, amount, mock, template, initialState }: { draftKey: string; amount: string; mock: boolean; template: string; initialState: OrderState }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "starting" | "paying" | "waiting" | "failed">(initialState === "PAYMENT_PENDING" ? "waiting" : "idle");
  const [error, setError] = useState("");
  const [mockOpen, setMockOpen] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval>>(undefined);
  const base = `/api/drafts/${draftKey}`;

  const waitForServer = () => {
    setPhase("waiting");
    clearInterval(poll.current);
    let tries = 0;
    poll.current = setInterval(async () => {
      tries++;
      const r = await fetch(base).then((x) => x.json()).catch(() => null);
      if (r?.linkToken) {
        clearInterval(poll.current);
        track("payment_success", template);
        track("experience_activated", template);
        router.push(`/d/${draftKey}/share`);
      } else if (r?.state === "PREVIEW_READY") {
        clearInterval(poll.current);
        track("payment_failure", template);
        setPhase("failed");
        setError("The payment didn't go through. Your details are saved, so you can try again.");
      } else if (tries > 90) {
        clearInterval(poll.current);
        setError("We're still waiting for the bank to confirm. You can leave this page; your link will appear here once it's confirmed.");
      }
    }, 2000);
  };

  useEffect(() => {
    if (initialState === "PAYMENT_PENDING") waitForServer();
    return () => clearInterval(poll.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    setError("");
    setPhase("starting");
    track("checkout_started", template);
    try {
      const res = await fetch(`${base}/checkout`, { method: "POST" });
      const s = (await res.json()) as Session & { error?: string };
      if (!res.ok) throw new Error(s.error || "Checkout couldn't start.");
      if (mock) { setMockOpen(true); setPhase("paying"); return; }
      const Rzp = await loadRazorpay();
      setPhase("paying");
      const rzp = new Rzp({
        ...s.client,
        handler: async () => { await fetch(`${base}/payment-submitted`, { method: "POST" }); waitForServer(); },
        modal: { ondismiss: () => setPhase("idle") },
      });
      rzp.on("payment.failed", () => { setPhase("failed"); setError("The payment didn't go through. Your details are saved, so you can try again."); });
      rzp.open();
    } catch (e) {
      setPhase("failed");
      setError((e as Error).message);
    }
  };

  const mockPay = async (outcome: "success" | "failure") => {
    setMockOpen(false);
    await fetch(`${base}/payment-submitted`, { method: "POST" });
    waitForServer();
    await fetch("/api/payments/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draftKey, outcome }) });
  };

  return (
    <>
      {phase === "waiting" ? (
        <div className="panel" role="status">
          <h3>Confirming your payment</h3>
          <p className="note" style={{ margin: 0 }}>We&apos;re waiting for the payment provider to confirm with our server. This usually takes a few seconds.</p>
        </div>
      ) : (
        <div className="row">
          <button className="btn accent" onClick={pay} disabled={phase === "starting" || phase === "paying"}>{phase === "starting" ? "Opening checkout…" : `Pay ${amount}`}</button>
          <a className="btn ghost small" href={`/d/${draftKey}/preview`}>Back to preview</a>
        </div>
      )}
      {mockOpen && (
        <div className="panel">
          <div className="eyebrow">Demo payment</div>
          <p className="note" style={{ margin: 0 }}>Real payments aren&apos;t switched on yet, so nothing is charged. Choose what happens, the same way the bank would tell us.</p>
          <div className="row">
            <button className="btn" onClick={() => mockPay("success")}>Simulate success</button>
            <button className="btn ghost" onClick={() => mockPay("failure")}>Simulate failure</button>
          </div>
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
    </>
  );
}

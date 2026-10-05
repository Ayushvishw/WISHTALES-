import Link from "next/link";
import { inr } from "@/components/Shell";
import { OrdersTable } from "@/components/admin";
import { dashboard } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/admin/auth";

const FUNNEL = [
  ["landing_visit", "Visited the site"],
  ["template_viewed", "Saw templates"],
  ["form_started", "Started a draft"],
  ["preview_generated", "Previewed"],
  ["checkout_started", "Started checkout"],
  ["payment_success", "Paid"],
  ["experience_opened", "Recipient opened"],
  ["experience_completed", "Recipient finished"],
] as const;

export default async function Overview() {
  await requireAdmin("orders.view");
  const d = await dashboard();
  const active = d.byState.ACTIVE ?? 0;
  const pending = (d.byState.PAYMENT_PENDING ?? 0) + (d.byState.CHECKOUT_STARTED ?? 0);
  const drafts = (d.byState.DRAFT ?? 0) + (d.byState.PREVIEW_READY ?? 0);
  const max = Math.max(1, ...FUNNEL.map(([k]) => d.funnel[k] ?? 0));
  return (
    <>
      <h1>Overview</h1>
      <div className="stats">
        <div className="stat"><b>{inr(d.revenueMinor)}</b><span>Paid, all time</span></div>
        <div className="stat"><b>{active}</b><span>Live surprises</span></div>
        <div className="stat"><b>{pending}</b><span>Waiting on payment</span></div>
        <div className="stat"><b>{drafts}</b><span>Unfinished drafts</span></div>
      </div>
      <section className="panel">
        <h2>Last 30 days</h2>
        <div className="funnel">
          {FUNNEL.map(([k, label]) => (
            <div key={k}><span>{label}</span><i style={{ width: `${((d.funnel[k] ?? 0) / max) * 100}%` }} /><em>{d.funnel[k] ?? 0}</em></div>
          ))}
        </div>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sec-h" style={{ margin: 0 }}><h2>Latest orders</h2><Link href="/admin/orders" className="note">See all</Link></div>
        <OrdersTable rows={d.recent} />
      </section>
    </>
  );
}

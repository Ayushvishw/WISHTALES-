import Link from "next/link";
import { appUrl } from "@/lib/url";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { inr } from "@/components/Shell";
import { Banner, Pill, when, type SP } from "@/components/admin";
import { can, requireAdmin } from "@/lib/admin/auth";
import { orderDetail } from "@/lib/admin/service";
import { canTransition } from "@/lib/orders/state";
import { disableLink, enableLink, refund } from "../../../actions";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams: SP }) {
  const a = await requireAdmin("orders.view");
  const { reference } = await params;
  const d = await orderDetail(reference);
  if (!d) notFound();
  const sp = await searchParams;
  const o = d.order;
  const manage = can(a.role, "orders.manage");
  const base = appUrl();
  return (
    <>
      <div>
        <Link href="/admin/orders" className="note">← Orders</Link>
        <h1 style={{ marginTop: 6 }}>{o.reference} <Pill v={o.state} /></h1>
      </div>
      <Banner sp={sp} />
      <div className="cols" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(0,.7fr)" }}>
        <div className="adm-main">
          <section className="panel">
            <h2>What they wrote</h2>
            <dl className="kv">
              {d.fields.map((f) => <Fragment key={f.key}><dt>{f.label}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{d.values[f.key] || "—"}</dd></Fragment>)}
            </dl>
          </section>
          <section className="panel">
            <h2>Photos ({d.photos.length})</h2>
            {d.photos.length ? <div className="thumbs">{d.photos.map((p) => <a key={p.id} href={p.url} target="_blank" rel="noreferrer"><img src={p.thumbUrl} alt="" /></a>)}</div> : <p className="note">None yet.</p>}
          </section>
          <section className="panel">
            <h2>History</h2>
            {d.history.length ? (
              <ul className="tips">{d.history.map((h) => <li key={h.id}><b>{h.action}</b> by {h.actor}, {when(h.at)}</li>)}</ul>
            ) : <p className="note" style={{ margin: 0 }}>No admin or payment events recorded.</p>}
          </section>
        </div>
        <aside className="adm-main">
          <section className="panel">
            <h2>Order</h2>
            <dl className="kv">
              <dt>Template</dt><dd>{d.templateName} v{d.templateVersion}</dd>
              <dt>Amount</dt><dd>{inr(o.amountMinor)}</dd>
              <dt>Created</dt><dd>{when(o.createdAt)}</dd>
              <dt>Paid</dt><dd>{when(o.paidAt)}</dd>
              <dt>Went live</dt><dd>{when(o.activatedAt)}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Link</h2>
            {d.link ? (
              <>
                <p style={{ margin: 0, overflowWrap: "anywhere", fontFamily: "var(--mono)", fontSize: 12 }}>{base}/w/{d.link.token}</p>
                <div><Pill v={d.link.status} /></div>
                {manage && d.link.status === "active" && (
                  <form action={disableLink}><input type="hidden" name="reference" value={o.reference} /><button className="btn ghost small">Switch link off</button></form>
                )}
                {manage && d.link.status === "disabled" && o.state === "ACTIVE" && (
                  <form action={enableLink}><input type="hidden" name="reference" value={o.reference} /><button className="btn ghost small">Switch link back on</button></form>
                )}
              </>
            ) : <p className="note" style={{ margin: 0 }}>Created automatically once payment is confirmed.</p>}
          </section>
          <section className="panel">
            <h2>Payments</h2>
            {d.payments.length ? d.payments.map((p) => (
              <dl className="kv" key={p.id}><dt>{p.provider}</dt><dd><Pill v={p.status} /> {inr(p.amountMinor)}</dd><dt>Payment id</dt><dd style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{p.providerPaymentId ?? p.providerOrderId}</dd></dl>
            )) : <p className="note" style={{ margin: 0 }}>No payment attempts.</p>}
            {manage && canTransition(o.state, "REFUNDED") && (
              <form action={refund} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="hidden" name="reference" value={o.reference} />
                <label className="fl" htmlFor="note"><span>Refund note</span><input id="note" name="note" placeholder="Why, and the Razorpay refund id" required /></label>
                <button className="btn ghost small">Mark as refunded</button>
                <small className="note">Issue the refund in Razorpay first. This records it here and switches the link off.</small>
              </form>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

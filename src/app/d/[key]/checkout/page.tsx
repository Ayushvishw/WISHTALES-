import { notFound, redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { inr, Shell } from "@/components/Shell";
import { getDraft, listMusic } from "@/lib/orders/service";
import { isMockPayments } from "@/lib/payments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const d = await getDraft(key);
  if (!d) notFound();
  if (d.state === "DRAFT") redirect(`/d/${key}`);
  if (d.linkToken) redirect(`/d/${key}/share`);
  const music = (await listMusic()).find((m) => m.id === d.musicId);
  return (
    <Shell step={3} state={d.state}>
      <div className="narrow">
        <div>
          <div className="eyebrow">Checkout</div>
          <h2 style={{ fontSize: 30, marginTop: 6 }}>{d.config.name} for {d.values.recipient_name}</h2>
        </div>
        <div className="panel">
          <dl className="kv">
            <dt>Order</dt><dd>{d.reference}</dd>
            <dt>Template</dt><dd>{d.config.name} · v{d.config.version}</dd>
            <dt>Photos</dt><dd>{d.photos.length}</dd>
            <dt>Music</dt><dd>{music?.title ?? "None"}</dd>
            <dt>Total</dt><dd><b>{inr(d.amountMinor)}</b></dd>
          </dl>
        </div>
        <CheckoutPanel draftKey={key} amount={inr(d.amountMinor)} mock={isMockPayments()} template={d.config.slug} initialState={d.state} />
      </div>
    </Shell>
  );
}

import { notFound, redirect } from "next/navigation";
import { appUrl } from "@/lib/url";
import { SharePanel } from "@/components/SharePanel";
import { Shell } from "@/components/Shell";
import { RsvpPanel } from "@/components/RsvpPanel";
import { getDraft, listRsvps, takesRsvps } from "@/lib/orders/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Share", robots: { index: false } };

export default async function SharePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const d = await getDraft(key);
  if (!d) notFound();
  if (!d.linkToken) redirect(d.state === "DRAFT" ? `/d/${key}` : `/d/${key}/checkout`);
  const base = appUrl();
  const url = `${base}/w/${d.linkToken}`;
  const invitation = takesRsvps(d.config);
  const replies = invitation ? await listRsvps(key) : [];
  return (
    <Shell step={4} state={d.state}>
      <div className="narrow">
        <div>
          <div className="eyebrow">It&apos;s ready</div>
          <h2 style={{ fontSize: 30, marginTop: 6 }}>{invitation ? "Send your invitation" : `Send ${d.values.recipient_name} their link`}</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>Anyone with this link can open {invitation ? "the invitation and reply" : "the experience"}, no account needed. The code at the end is random, so it can&apos;t be guessed.</p>
        <SharePanel url={url} recipient={d.values.recipient_name} template={d.config.slug} invitation={invitation} />
        {invitation && <RsvpPanel draftKey={key} replies={replies.map((r) => ({ id: r.id, name: r.name, attending: r.attending, guests: r.guests, message: r.message, hidden: r.hidden, at: r.createdAt.toISOString() }))} />}
        <div className="panel">
          <dl className="kv">
            <dt>Order</dt><dd>{d.reference} · <b>{d.state}</b></dd>
            <dt>Template</dt><dd>{d.config.name} v{d.config.version} (locked for this order)</dd>
          </dl>
          <p className="note" style={{ margin: 0 }}>Keep this page&apos;s address. It&apos;s how you get back to your order and link.</p>
        </div>
      </div>
    </Shell>
  );
}

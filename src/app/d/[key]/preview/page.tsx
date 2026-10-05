import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreviewStage } from "@/components/PreviewStage";
import { Shell } from "@/components/Shell";
import { getDraft, getPreviewExperience } from "@/lib/orders/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false } };

export default async function PreviewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const d = await getDraft(key);
  if (!d) notFound();
  // Preview only renders once every required field and photo is in place.
  if (d.state === "DRAFT") redirect(`/d/${key}`);
  const exp = await getPreviewExperience(key);
  if (!exp) notFound();
  const paid = !["PREVIEW_READY", "CHECKOUT_STARTED"].includes(d.state);
  return (
    <Shell step={2} state={d.state}>
      <div className="stagewrap">
        <PreviewStage experience={exp} template={d.config.slug} />
        <aside className="side">
          <div className="panel">
            <div className="eyebrow">Preview</div>
            <h3>This is exactly what {exp.values.recipient_name} will see</h3>
            <p className="note" style={{ margin: 0 }}>It runs on the same template and data as the paid version. Only the ribbon is removed after payment.</p>
            {paid ? (
              <Link className="btn accent" href={`/d/${key}/share`}>Go to your link</Link>
            ) : (
              <>
                <Link className="btn accent" href={`/d/${key}/checkout`}>Looks perfect, continue</Link>
                <Link className="btn ghost" href={`/d/${key}`}>Edit details</Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

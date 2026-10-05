import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { inr, Shell } from "@/components/Shell";
import { Track } from "@/components/Track";
import { createDraft, listOccasions, listTemplates } from "@/lib/orders/service";

export const dynamic = "force-dynamic";

async function personalize(formData: FormData) {
  "use server";
  const key = await createDraft(String(formData.get("template")));
  redirect(`/d/${key}`);
}

export default async function OccasionPage({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;
  const occ = (await listOccasions()).find((o) => o.slug === occasion && o.status === "live");
  if (!occ) notFound();
  const list = await listTemplates(occasion);
  return (
    <Shell step={0}>
      <Track events={["occasion_selected", "template_viewed"]} template={occasion} />
      <div className="sec-h"><h2>{occ.name} templates</h2><span className="note">Every template plays on phones first</span></div>
      <div className="tgrid">
        {list.map((t) => (
          <article className="tcard" key={t.slug}>
            <div className="thumb" style={{ background: t.theme.bg, color: t.theme.fg }}>
              <small style={{ color: t.theme.accent }}>{occ.name} · v{t.version}</small>
              <strong style={{ fontFamily: t.theme.display }}>Happy birthday,<br /><span style={{ color: t.theme.accent }}>Riya</span></strong>
              <span className="glyph" style={{ color: t.theme.accent2 }}>{t.scenes.length} scenes</span>
            </div>
            <div className="tbody">
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <div className="chips">{t.traits.map((x) => <span className="chip" key={x}>{x}</span>)}</div>
              <div className="tfoot">
                <span className="price">{inr(t.priceMinor)}</span>
                <form action={personalize} className="row">
                  <Link className="btn ghost small" href={`/sample/${t.slug}`}>Watch sample</Link>
                  <input type="hidden" name="template" value={t.slug} />
                  <button className="btn small" type="submit">Personalize</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

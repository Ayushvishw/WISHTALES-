import Link from "next/link";
import { notFound } from "next/navigation";
import { inr } from "@/components/Shell";
import { Banner, Pill, when, type SP } from "@/components/admin";
import { can, requireAdmin } from "@/lib/admin/auth";
import { bumpPatch, templateDetail } from "@/lib/admin/service";
import { newVersion, photoPrices, price, templateStatus, versionStatus } from "../../../actions";

export default async function TemplatePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SP }) {
  const a = await requireAdmin("orders.view");
  const { slug } = await params;
  const d = await templateDetail(slug);
  if (!d) notFound();
  const sp = await searchParams;
  const edit = can(a.role, "templates.manage");
  const live = d.versions.find((v) => v.status === "published");
  const latest = d.versions[0];
  const draft = latest ? JSON.stringify({ ...latest.config, version: bumpPatch(latest.version) }, null, 2) : "";
  return (
    <>
      <div>
        <Link href="/admin/templates" className="note">← Templates</Link>
        <h1 style={{ marginTop: 6 }}>{d.template.name} <Pill v={d.template.status} /></h1>
      </div>
      <Banner sp={sp} />
      <div className="row">
        <Link className="btn ghost small" href={`/sample/${slug}`} target="_blank">Play the sample</Link>
        {edit && (
          <form action={templateStatus}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="status" value={d.template.status === "published" ? "unpublished" : "published"} />
            <button className="btn ghost small">{d.template.status === "published" ? "Hide from customers" : "Show to customers"}</button>
          </form>
        )}
      </div>

      {edit && live && (
        <section className="panel">
          <h2>Price</h2>
          <form action={price} className="inline">
            <input type="hidden" name="slug" value={slug} />
            <label htmlFor="rupees" className="note">Now {inr(live.priceMinor)}. New price in ₹</label>
            <input id="rupees" name="rupees" type="number" min={1} max={100000} step="1" defaultValue={live.priceMinor / 100} required />
            <button className="btn small">Update price</button>
          </form>
          <small className="note">People who already paid keep their price. Drafts started before the change keep the old price too.</small>
        </section>
      )}

      {edit && live?.config.photoTiers && live.config.photoTiers.length > 1 && (
        <section className="panel">
          <h2>Photo prices</h2>
          <p className="note" style={{ margin: 0 }}>The template price includes {live.config.photoTiers[0].photos} photos. Customers pay the smallest step that fits their photos.</p>
          <form action={photoPrices} className="inline">
            <input type="hidden" name="slug" value={slug} />
            {live.config.photoTiers.map((t, i) => (
              <label key={t.photos} className="note" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {t.photos} photos: + ₹
                {i === 0 ? <><input type="hidden" name="add" value="0" /><input type="number" value={0} disabled style={{ width: 90 }} /></> : <input name="add" type="number" min={0} max={100000} step="1" defaultValue={t.addMinor / 100} required style={{ width: 90 }} />}
                <small>Total {inr(live.priceMinor + t.addMinor)}</small>
              </label>
            ))}
            <button className="btn small">Update photo prices</button>
          </form>
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>Versions</h2>
        <div className="tbl">
          <table>
            <thead><tr><th>Version</th><th>Status</th><th>Price</th><th>Orders</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {d.versions.map((v) => (
                <tr key={v.id}>
                  <td>v{v.version}</td><td><Pill v={v.status} /></td><td>{inr(v.priceMinor)}</td><td>{v.orders}</td><td>{when(v.createdAt)}</td>
                  <td>
                    {edit && (
                      <form action={versionStatus}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="version" value={v.version} />
                        <input type="hidden" name="status" value={v.status === "published" ? "unpublished" : "published"} />
                        <button className="btn ghost small">{v.status === "published" ? "Stop offering" : "Make this the live version"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {edit && (
        <details className="panel">
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Advanced: create a new version from its settings</summary>
          <p className="note">Edit the text, colors, scenes or fields below. The version number must be higher than the newest one. It&apos;s checked before saving, so a mistake can&apos;t break the live site.</p>
          <form action={newVersion} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="hidden" name="slug" value={slug} />
            <textarea className="code" name="config" defaultValue={draft} spellCheck={false} aria-label="Template settings (JSON)" />
            <label className="row" style={{ gap: 8 }}><input type="checkbox" name="publish" style={{ width: "auto" }} /> Make it live right away</label>
            <button className="btn small" style={{ alignSelf: "flex-start" }}>Save new version</button>
          </form>
        </details>
      )}
    </>
  );
}

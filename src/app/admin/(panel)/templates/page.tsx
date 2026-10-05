import Link from "next/link";
import { inr } from "@/components/Shell";
import { Pill } from "@/components/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { listTemplatesAdmin } from "@/lib/admin/service";

export default async function Templates() {
  await requireAdmin("orders.view");
  const rows = await listTemplatesAdmin();
  return (
    <>
      <h1>Templates</h1>
      <p className="note" style={{ margin: 0 }}>Changing a template creates a new version. Orders already bought keep the version they were made with.</p>
      <div className="tbl">
        <table>
          <thead><tr><th>Template</th><th>Occasion</th><th>Shown to customers</th><th>Live version</th><th>Price</th><th>Sold</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td><Link href={`/admin/templates/${t.slug}`}>{t.name}</Link></td>
                <td>{t.occasion}</td>
                <td><Pill v={t.status} /></td>
                <td>{t.live ? `v${t.live.version}` : <Pill v="unpublished" />} <span className="note">of {t.versions}</span></td>
                <td>{t.live ? inr(t.live.priceMinor) : "—"}</td>
                <td>{t.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

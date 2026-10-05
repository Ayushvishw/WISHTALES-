import { Banner, Pill, type SP } from "@/components/admin";
import { can, requireAdmin } from "@/lib/admin/auth";
import { listMusicAdmin, listOccasionsAdmin } from "@/lib/admin/service";
import { musicStatus, occasionStatus } from "../../actions";

export default async function Catalog({ searchParams }: { searchParams: SP }) {
  const a = await requireAdmin("orders.view");
  const sp = await searchParams;
  const edit = can(a.role, "catalog.manage");
  const [occ, music] = await Promise.all([listOccasionsAdmin(), listMusicAdmin()]);
  return (
    <>
      <h1>Occasions and music</h1>
      <Banner sp={sp} />
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>Occasions</h2>
        <p className="note" style={{ margin: 0 }}>Live occasions can be ordered. "Coming soon" shows on the home page but can't be chosen. Hidden ones don't appear at all.</p>
        <div className="tbl">
          <table>
            <thead><tr><th>Occasion</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {occ.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td><td><Pill v={o.status} /></td>
                  <td>{edit && (
                    <form action={occasionStatus} className="inline">
                      <input type="hidden" name="slug" value={o.slug} />
                      <select name="status" defaultValue={o.status} aria-label={`Status for ${o.name}`} style={{ width: "auto" }}>
                        <option value="live">Live</option><option value="coming_soon">Coming soon</option><option value="hidden">Hidden</option>
                      </select>
                      <button className="btn ghost small">Save</button>
                    </form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ margin: 0 }}>An occasion needs at least one published template before it is useful as Live.</p>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>Music</h2>
        <div className="tbl">
          <table>
            <thead><tr><th>Track</th><th>License</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {music.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td><td className="note">{m.license}</td><td><Pill v={m.status} /></td>
                  <td>{edit && (
                    <form action={musicStatus}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="status" value={m.status === "active" ? "retired" : "active"} />
                      <button className="btn ghost small">{m.status === "active" ? "Retire" : "Bring back"}</button>
                    </form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ margin: 0 }}>Retired tracks can't be picked for new orders. Surprises that already use them keep playing them.</p>
      </section>
    </>
  );
}

import { when } from "@/components/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAudit } from "@/lib/admin/service";

export default async function Activity() {
  await requireAdmin("audit.view");
  const rows = await listAudit();
  return (
    <>
      <h1>Activity log</h1>
      <p className="note" style={{ margin: 0 }}>Every admin change and payment warning, newest first.</p>
      <div className="tbl">
        <table>
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>On</th><th>Details</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{when(r.at)}</td><td>{r.actor}</td><td>{r.action}</td><td>{r.target ?? "—"}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 12, overflowWrap: "anywhere" }}>{r.details ? JSON.stringify(r.details) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

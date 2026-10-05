import Link from "next/link";
import { inr } from "@/components/Shell";
import type { searchOrders } from "@/lib/admin/service";

/** Small shared pieces for admin pages. */
export function Banner({ sp }: { sp: { notice?: string; error?: string } }) {
  if (sp.error) return <div className="banner bad" role="alert">{sp.error}</div>;
  if (sp.notice) return <div className="banner ok" role="status">{sp.notice}</div>;
  return null;
}

export const Pill = ({ v }: { v: string }) => <span className={`pill ${v}`}>{v.replace(/_/g, " ")}</span>;

export const when = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export type SP = Promise<{ notice?: string; error?: string; q?: string; state?: string }>;

export function OrdersTable({ rows }: { rows: Awaited<ReturnType<typeof searchOrders>> }) {
  if (!rows.length) return <p className="note">No orders yet. They appear here as soon as someone starts personalizing a template.</p>;
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Order</th><th>For</th><th>From</th><th>Template</th><th>State</th><th>Amount</th><th>Created</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.reference}>
              <td><Link href={`/admin/orders/${r.reference}`}>{r.reference}</Link></td>
              <td>{r.recipient || "—"}</td><td>{r.sender || "—"}</td><td>{r.template}</td>
              <td><Pill v={r.state} />{r.linkStatus === "disabled" && <> <Pill v="disabled" /></>}</td>
              <td>{inr(r.amountMinor)}</td><td>{when(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

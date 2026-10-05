import { Banner, OrdersTable, type SP } from "@/components/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { searchOrders } from "@/lib/admin/service";
import { ORDER_STATES } from "@/lib/orders/state";

export default async function Orders({ searchParams }: { searchParams: SP }) {
  await requireAdmin("orders.view");
  const sp = await searchParams;
  const rows = await searchOrders({ q: sp.q, state: sp.state, limit: 200 });
  return (
    <>
      <h1>Orders</h1>
      <Banner sp={sp} />
      <form className="filters" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Order number, link, or recipient's name" aria-label="Search orders" />
        <select name="state" defaultValue={sp.state ?? ""} aria-label="Filter by state">
          <option value="">All states</option>
          {ORDER_STATES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button className="btn small">Search</button>
      </form>
      <OrdersTable rows={rows} />
      {rows.length === 200 && <p className="note">Showing the newest 200. Narrow the search to see others.</p>}
    </>
  );
}

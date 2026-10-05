import Link from "next/link";
import { can, requireAdmin } from "@/lib/admin/auth";
import { logout } from "../actions";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await requireAdmin();
  return (
    <div className="wrap">
      <header className="bar">
        <Link href="/admin" className="brand" style={{ textDecoration: "none" }}><b>Wish Tale</b><span>Admin</span></Link>
        <Link href="/" className="btn ghost small">View shop</Link>
      </header>
      <div className="adm">
        <nav className="adm-nav" aria-label="Admin">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/templates">Templates</Link>
          <Link href="/admin/catalog">Occasions and music</Link>
          {can(a.role, "users.manage") && <Link href="/admin/team">Team</Link>}
          {can(a.role, "audit.view") && <Link href="/admin/activity">Activity log</Link>}
          <div className="who">
            <span>{a.email} · {a.role}</span>
            <form action={logout}><button className="btn ghost small">Sign out</button></form>
          </div>
        </nav>
        <div className="adm-main">{children}</div>
      </div>
    </div>
  );
}

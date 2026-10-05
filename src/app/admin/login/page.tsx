import { redirect } from "next/navigation";
import { currentAdmin, hasAnyAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  const setup = !(await hasAnyAdmin());
  return (
    <div className="wrap">
      <div className="authbox">
        <div className="eyebrow">Wish Tale admin</div>
        <h1 style={{ fontSize: 30 }}>{setup ? "Create the owner account" : "Sign in"}</h1>
        {setup && <p className="note" style={{ margin: 0 }}>This appears only once. Enter the setup code from your server settings (ADMIN_SETUP_CODE), your email and a password of at least 12 characters.</p>}
        <LoginForm setup={setup} />
      </div>
    </div>
  );
}

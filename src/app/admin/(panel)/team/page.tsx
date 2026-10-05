import { Banner, when, type SP } from "@/components/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdmins } from "@/lib/admin/service";
import { addAdmin, deleteAdmin } from "../../actions";

export default async function Team({ searchParams }: { searchParams: SP }) {
  const a = await requireAdmin("users.manage");
  const sp = await searchParams;
  const users = await listAdmins();
  return (
    <>
      <h1>Team</h1>
      <Banner sp={sp} />
      <div className="tbl">
        <table>
          <thead><tr><th>Email</th><th>Role</th><th>Added</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td><td>{u.role}</td><td>{when(u.createdAt)}</td>
                <td>{u.id !== a.id && (
                  <form action={deleteAdmin}><input type="hidden" name="id" value={u.id} /><button className="btn ghost small">Remove</button></form>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel">
        <h2>Add someone</h2>
        <ul className="tips">
          <li><b>Owner</b> can do everything, including managing the team.</li>
          <li><b>Editor</b> manages templates, prices, occasions and music.</li>
          <li><b>Support</b> sees orders and can switch links off or record refunds.</li>
        </ul>
        <form action={addAdmin} className="f2">
          <label className="fl" htmlFor="email"><span>Email</span><input id="email" name="email" type="email" required /></label>
          <label className="fl" htmlFor="role"><span>Role</span><select id="role" name="role" defaultValue="support"><option value="owner">Owner</option><option value="editor">Editor</option><option value="support">Support</option></select></label>
          <label className="fl wide" htmlFor="password"><span>Temporary password</span><input id="password" name="password" type="text" minLength={12} required autoComplete="off" /><small>At least 12 characters. Share it with them privately.</small></label>
          <div><button className="btn small">Add account</button></div>
        </form>
      </section>
    </>
  );
}

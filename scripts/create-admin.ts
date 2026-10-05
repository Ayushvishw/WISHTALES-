/** Usage: npm run admin:create -- you@example.com owner "a-long-password" */
import { createAdmin } from "@/lib/admin/service";
import type { Role } from "@/lib/admin/auth";

const [email, role = "owner", password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run admin:create -- <email> <owner|editor|support> "<password>"');
  process.exit(1);
}
createAdmin("cli", email, role as Role, password)
  .then((u) => { console.log(`Created ${u.email} (${u.role}).`); process.exit(0); })
  .catch((e) => { console.error(e.message); process.exit(1); });

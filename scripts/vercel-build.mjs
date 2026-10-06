import { execSync } from "node:child_process";

// Preview deployments share the production database, so only production deploys migrate and seed it.
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
if (process.env.VERCEL_ENV === "production") {
  run("npm run db:migrate");
  run("npm run db:seed");
} else {
  console.log(`Skipping migrate and seed for a ${process.env.VERCEL_ENV ?? "non-Vercel"} build.`);
}
run("next build");

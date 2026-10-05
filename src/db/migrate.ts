import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { db } from "./index";

const migrationsFolder = "./drizzle";

async function main() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) await migratePg(db, { migrationsFolder });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else await migratePglite(db as any, { migrationsFolder });
  console.log("Migrations applied.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

/**
 * Production uses Postgres via DATABASE_URL. Without it (local development and
 * tests) an embedded PGlite database is used, so no database server is needed.
 */
function create() {
  const url = process.env.DATABASE_URL;
  if (url) return drizzlePg(postgres(url, { max: 10 }), { schema });
  const dir = process.env.PGLITE_DIR ?? ".data/db";
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  const client = dir === "memory" ? new PGlite() : new PGlite(dir);
  return drizzlePglite(client, { schema }) as unknown as ReturnType<typeof drizzlePg<typeof schema>>;
}

const g = globalThis as unknown as { __wtdb?: ReturnType<typeof create> };
export const db = g.__wtdb ?? (g.__wtdb = create());
export type DB = typeof db;
export { schema };

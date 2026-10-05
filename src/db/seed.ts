import { and, eq } from "drizzle-orm";
import { CATALOG, MUSIC, OCCASIONS } from "@/lib/templates/catalog";
import { db } from "./index";
import { musicTracks, occasions, templates, templateVersions } from "./schema";

/**
 * Idempotent: inserts occasions, music and template versions that don't exist
 * yet. Existing template versions are never modified (they are immutable).
 */
export async function seed() {
  for (const [i, o] of OCCASIONS.entries()) {
    await db
      .insert(occasions)
      .values({ slug: o.slug, name: o.name, status: o.live ? "live" : "coming_soon", sort: i })
      .onConflictDoUpdate({ target: occasions.slug, set: { name: o.name, sort: i } });
  }
  for (const m of MUSIC) {
    await db.insert(musicTracks).values({ ...m }).onConflictDoNothing();
  }
  for (const t of CATALOG) {
    const [occ] = await db.select().from(occasions).where(eq(occasions.slug, t.occasion));
    if (!occ) throw new Error(`Unknown occasion ${t.occasion}`);
    await db
      .insert(templates)
      .values({ slug: t.slug, name: t.name, occasionId: occ.id, status: "published" })
      .onConflictDoNothing();
    const [tpl] = await db.select().from(templates).where(eq(templates.slug, t.slug));
    const existing = await db
      .select({ id: templateVersions.id })
      .from(templateVersions)
      .where(and(eq(templateVersions.templateId, tpl.id), eq(templateVersions.version, t.version)));
    if (existing.length) continue;
    await db.insert(templateVersions).values({
      templateId: tpl.id,
      version: t.version,
      config: t,
      priceMinor: t.priceMinor,
      currency: t.currency,
      status: "published",
      publishedAt: new Date(),
    });
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => {
      console.log("Seeded occasions, music and templates.");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

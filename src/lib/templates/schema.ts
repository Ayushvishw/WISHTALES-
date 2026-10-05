import { z } from "zod";

/**
 * A template is pure data: theme, personalization fields, media rules and an
 * ordered list of scenes. The experience engine renders any template; adding
 * a new experience means adding a config, not a new page.
 */

export const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string(),
  type: z.enum(["text", "textarea", "date", "number"]),
  required: z.boolean().default(false),
  max: z.number().int().positive().optional(),
  min: z.number().optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
  /** Used when the customer leaves an optional field empty. */
  default: z.string().optional(),
});
export type TemplateField = z.infer<typeof fieldSchema>;

const sceneBase = { id: z.string().regex(/^[a-z][a-z0-9-]*$/) };

export const sceneSchema = z.discriminatedUnion("type", [
  z.object({ ...sceneBase, type: z.literal("hold"), variant: z.enum(["seal", "gift", "star"]), title: z.string(), hint: z.string() }),
  z.object({ ...sceneBase, type: z.literal("greeting"), title: z.string(), sub: z.string().optional(), showAge: z.boolean().optional() }),
  z.object({ ...sceneBase, type: z.literal("photos"), layout: z.enum(["stack", "film"]), title: z.string() }),
  z.object({
    ...sceneBase,
    type: z.literal("puzzle"),
    puzzle: z.enum(["scratch", "swap", "match"]),
    title: z.string(),
    hint: z.string(),
    /** Photo indexes the puzzle uses (0-based, in the customer's order). */
    photos: z.array(z.number().int().min(0)).min(1),
    /** Text revealed on completion; may contain {{placeholders}}. */
    reveal: z.string().optional(),
    /** Seconds before the "Show me" fallback appears. */
    fallbackAfter: z.number().int().positive().default(9),
  }),
  z.object({ ...sceneBase, type: z.literal("message") }),
  z.object({ ...sceneBase, type: z.literal("ritual"), ritual: z.enum(["candles", "star"]), title: z.string() }),
  z.object({ ...sceneBase, type: z.literal("closing") }),
]);
export type Scene = z.infer<typeof sceneSchema>;

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeSchema = z.object({
  bg: color, fg: color, muted: color, line: color, card: color,
  accent: color, accent2: color, onAccent: color, paper: color, paperInk: color,
  display: z.string(), body: z.string(), letter: z.string(), hand: z.string(),
  fx: z.array(color).min(1),
});
export type Theme = z.infer<typeof themeSchema>;

export const templateConfigSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    occasion: z.string(),
    name: z.string(),
    description: z.string(),
    traits: z.array(z.string()),
    /** Price in the smallest currency unit (paise). */
    priceMinor: z.number().int().positive(),
    currency: z.literal("INR"),
    theme: themeSchema,
    fields: z.array(fieldSchema).min(1),
    photos: z.object({ min: z.number().int().min(0), max: z.number().int().positive() }),
    music: z.object({ default: z.string() }),
    scenes: z.array(sceneSchema).min(1),
  })
  .superRefine((t, ctx) => {
    const keys = new Set<string>();
    for (const f of t.fields) {
      if (keys.has(f.key)) ctx.addIssue({ code: "custom", message: `Duplicate field key ${f.key}` });
      keys.add(f.key);
    }
    for (const k of ["recipient_name", "sender_name"]) {
      if (!keys.has(k)) ctx.addIssue({ code: "custom", message: `Template must define ${k}` });
    }
    const ids = new Set<string>();
    for (const s of t.scenes) {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: `Duplicate scene id ${s.id}` });
      ids.add(s.id);
      if (s.type === "puzzle" && s.photos.some((i) => i >= t.photos.min)) {
        ctx.addIssue({ code: "custom", message: `Scene ${s.id} uses a photo slot beyond the required minimum` });
      }
    }
    if (t.photos.min > t.photos.max) ctx.addIssue({ code: "custom", message: "photos.min is greater than photos.max" });
  });
export type TemplateConfig = z.infer<typeof templateConfigSchema>;

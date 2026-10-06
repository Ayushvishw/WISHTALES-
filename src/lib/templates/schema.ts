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

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

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

/* ---------------- story layout: one scrolling page of chapters ---------------- */

export const MOTIFS = ["heart", "star", "petal", "bubble", "pixel", "marigold", "candy", "sparkle", "butterfly", "shell", "note", "ring", "rose", "moon", "key"] as const;
const motif = z.enum(MOTIFS);
const copy = { eyebrow: z.string(), title: z.string(), lead: z.string().optional() };

export const chapterSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    kicker: z.string(),
    lead: z.string(),
    floaters: z.enum(["balloons", "bubbles", "lanterns", "hearts", "none"]),
    nameStyle: z.enum(["script", "display", "pixel"]),
    /** Shown one by one as floaters are popped. */
    wishes: z.array(z.string()).min(1),
    showAge: z.boolean().optional(),
  }),
  z.object({ type: z.literal("question"), ...copy, yes: z.string(), no: z.array(z.string()).min(2), done: z.string() }),
  z.object({
    type: z.literal("catch"), ...copy, item: motif, target: z.number().int().min(5).max(40), seconds: z.number().int().min(10).max(60),
    win: z.string(), winSub: z.string(), lose: z.string(), loseSub: z.string(),
  }),
  z.object({ type: z.literal("slide"), ...copy, photo: z.number().int().min(0), solved: z.string(), solvedSub: z.string() }),
  z.object({
    type: z.literal("wheel"), ...copy, spins: z.number().int().min(1).max(5),
    /** Wheel slices when the customer leaves the field empty. Exactly 8. */
    items: z.array(z.string().max(18)).length(8), field: z.string().optional(), done: z.string(),
  }),
  z.object({ type: z.literal("gallery"), ...copy, style: z.enum(["polaroid", "frames", "film", "string"]), captions: z.array(z.string()).optional() }),
  z.object({ type: z.literal("flips"), ...copy, items: z.array(z.string()).min(3).max(8), field: z.string().optional() }),
  z.object({ type: z.literal("memory"), ...copy, pairs: z.number().int().min(3).max(6), done: z.string() }),
  z.object({ type: z.literal("scratch"), ...copy, reveal: z.string(), cover: z.string() }),
  z.object({
    type: z.literal("ritual"), ...copy, kind: z.enum(["candles", "diyas", "champagne", "lanterns", "rockets", "lovelock", "ringbox"]),
    count: z.number().int().min(1).max(9), done: z.string(), again: z.string(),
  }),
  z.object({ type: z.literal("letter"), ...copy, style: z.enum(["envelope", "bottle", "terminal", "scroll", "postcard"]), field: z.string() }),
  z.object({
    type: z.literal("finale"), ...copy, button: z.string(), headline: z.string(), signoff: z.string(), effect: z.enum(["fireworks", "confetti", "hearts", "petals"]),
  }),
  /** Counts the time since a date field: days, hours, minutes, live. */
  z.object({ type: z.literal("counter"), ...copy, field: z.string(), fallback: z.string(), done: z.string() }),
  /** Milestones of a story ("When | What" per line), each with a photo. Scrolls sideways in a scrolling story. */
  z.object({ type: z.literal("timeline"), ...copy, items: z.array(z.string()).min(3).max(8), field: z.string().optional() }),
  /** Tap the stars in order to draw a shape; the line is revealed at the end. */
  z.object({ type: z.literal("stars"), ...copy, shape: z.enum(["heart", "ring", "infinity"]), reveal: z.string() }),
  /** Press and hold to fill a love meter past 100%. */
  z.object({ type: z.literal("meter"), ...copy, levels: z.array(z.string()).min(3).max(6), field: z.string().optional(), done: z.string() }),
  /** Tap to grow a flower per reason, building a bouquet. */
  z.object({ type: z.literal("bouquet"), ...copy, items: z.array(z.string()).min(3).max(7), field: z.string().optional(), done: z.string() }),
  /** Multiple choice: "Question | right answer | wrong | wrong" per line. */
  z.object({ type: z.literal("quiz"), ...copy, items: z.array(z.string()).min(2).max(6), field: z.string().optional(), win: z.string(), lose: z.string() }),
  /** Promise cards sealed one by one with a wax stamp. */
  z.object({ type: z.literal("promises"), ...copy, items: z.array(z.string()).min(3).max(7), field: z.string().optional(), done: z.string() }),
]);
export type Chapter = z.infer<typeof chapterSchema>;

/** A whole visual style for a story template: decorations, frames, dividers and the shop poster. */
export const SKINS = [
  "starlit", "royal", "arcade", "ocean", "garden", "galaxy", "desi", "candy", "gala", "scrapbook",
  "timeless", "diary", "moonlit", "cafe", "golden", "velvet", "nebula", "blush", "neon", "fairy",
] as const;

export const storySchema = z.object({
  skin: z.enum(SKINS).optional(),
  /** "scroll" reads top to bottom; "swipe" shows one chapter per screen and moves sideways. */
  flow: z.enum(["scroll", "swipe"]).optional(),
  opener: z.object({ kind: z.enum(["gift", "envelope", "chest", "ringbox"]), eyebrow: z.string(), hint: z.string(), sub: z.string() }),
  motif,
  ambient: z.object({
    orbs: z.array(color).length(3),
    particles: z.enum(["petals", "fireflies", "bubbles", "stars", "confetti", "sparks", "none"]),
    colors: z.array(color).min(1),
  }),
  /** Background of the page; a CSS color or gradient built only from theme colors. */
  backdrop: z.string().regex(/^[#a-z0-9(),.%\s-]+$/i).optional(),
  chapters: z.array(chapterSchema).min(3),
});
export type Story = z.infer<typeof storySchema>;

export const themeSchema = z.object({
  bg: color, fg: color, muted: color, line: color, card: color,
  accent: color, accent2: color, onAccent: color, paper: color, paperInk: color,
  display: z.string(), body: z.string(), letter: z.string(), hand: z.string(),
  fx: z.array(color).min(1),
  /** Third accent used by story templates (highlights, tickets, wheel hub). */
  accent3: color.optional(),
  /** Google Fonts css2 query loaded with the experience, e.g. "family=Fraunces:wght@500;700&family=Great+Vibes". */
  fonts: z.string().regex(/^family=[A-Za-z0-9+:;,@.&=]+$/).optional(),
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
    /** Classic step-by-step scenes, or one scrolling page of chapters ("story"). */
    layout: z.enum(["scenes", "story"]).default("scenes"),
    scenes: z.array(sceneSchema).default([]),
    story: storySchema.optional(),
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
    if (t.layout === "scenes" && !t.scenes.length) ctx.addIssue({ code: "custom", message: "A scenes template needs at least one scene" });
    if (t.layout === "story") {
      if (!t.story) ctx.addIssue({ code: "custom", message: "A story template needs a story" });
      for (const c of t.story?.chapters ?? []) {
        if (c.type === "slide" && c.photo >= t.photos.min) ctx.addIssue({ code: "custom", message: "The slide puzzle uses a photo slot beyond the required minimum" });
        if (c.type === "memory" && c.pairs > t.photos.min) ctx.addIssue({ code: "custom", message: "The memory game needs more pairs than the required photos" });
        for (const k of ["field" in c ? c.field : undefined].filter(Boolean) as string[]) {
          if (!keys.has(k)) ctx.addIssue({ code: "custom", message: `Chapter ${c.type} reads unknown field ${k}` });
        }
      }
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
export type TemplateInput = z.input<typeof templateConfigSchema>;

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
/** Painted artwork shipped with the site, in public/art. Commercial use is allowed for all of it. */
export const BLESSING_ART = ["ganesha"] as const;
export const SCENE_ART = ["entrance", "varmala", "phere"] as const;

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
  z.object({ type: z.literal("meter"), ...copy, levels: z.array(z.string()).min(3).max(6), done: z.string() }),
  /** Tap to grow a flower per reason, building a bouquet. */
  z.object({ type: z.literal("bouquet"), ...copy, items: z.array(z.string()).min(3).max(7), field: z.string().optional(), done: z.string() }),
  /** Multiple choice: "Question | right answer | wrong | wrong" per line. */
  z.object({ type: z.literal("quiz"), ...copy, items: z.array(z.string()).min(2).max(6), field: z.string().optional(), win: z.string(), lose: z.string() }),
  /** Promise cards sealed one by one with a wax stamp. */
  z.object({ type: z.literal("promises"), ...copy, items: z.array(z.string()).min(3).max(7), field: z.string().optional(), done: z.string() }),
  /**
   * Invitations: the card itself, opening the story like a hero. Shows the names, the occasion,
   * and the date, time and venue from the event_date, event_time and venue_name fields.
   */
  z.object({ type: z.literal("invite"), eyebrow: z.string(), intro: z.string(), names: z.string(), line: z.string(), families: z.string().optional() }),
  /** Live countdown to a date field. */
  z.object({ type: z.literal("countdown"), ...copy, field: z.string(), done: z.string() }),
  /** The schedule: "Event | When | Where | Map link" per line, each with directions. */
  z.object({ type: z.literal("events"), ...copy, field: z.string() }),
  /** Venue, address, directions and "add to calendar" from the venue_name, venue_address, map_link and event fields. */
  z.object({ type: z.literal("venue"), ...copy }),
  /** Guests reply: coming or not, how many, and a wish for the hosts. Replies reach the host's order page. */
  z.object({ type: z.literal("rsvp"), ...copy, thanks: z.string() }),
  /** A wall of the wishes guests left with their replies. */
  z.object({ type: z.literal("wishes"), ...copy, empty: z.string() }),
  /** A painted blessing that opens the story full screen, e.g. Lord Ganesha with a mantra and a verse. */
  z.object({ type: z.literal("blessing"), art: z.enum(BLESSING_ART), mantra: z.string(), verse: z.string().optional(), line: z.string() }),
  /** A painted moment of the day (the couple's entry, varmala, pheras) played like a film scene. */
  z.object({ type: z.literal("scene"), art: z.enum(SCENE_ART), eyebrow: z.string(), title: z.string(), line: z.string().optional() }),
  /** The customer's photos as a film: each one fills the screen, drifts slowly and fades into the next. */
  z.object({ type: z.literal("film"), ...copy, captions: z.array(z.string()).max(8).optional() }),
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

/* ---------------- video layout: a downloadable video invitation ---------------- */

/** Decorations drawn around every scene of a video. */
export const VIDEO_ORNAMENTS = ["mandala", "deco", "floral", "arch", "toran", "frame", "stars", "minimal"] as const;
/** What drifts across the video. */
export const VIDEO_PARTICLES = ["petals", "marigold", "sparkles", "bokeh", "confetti", "hearts", "stars", "lanterns", "none"] as const;
/** Paintings a video scene can fill the screen with (public/art/wedding). */
export const VIDEO_ART = ["ganesha", "entrance", "varmala", "phere"] as const;

/** Background footage for a scene: public/video/clips/<clip>.mp4, played under the words. */
const clip = { clip: z.string().regex(/^[a-z0-9-]+$/).optional() };
const shot = { ...clip, seconds: z.number().min(2).max(12).optional() };
const words = z.string().max(160);

/**
 * One scene of a video. Text may contain {{placeholders}}. A scene whose content is
 * missing (no photo, no events, no family names) is skipped, so a video always reads well.
 */
export const videoSceneSchema = z.discriminatedUnion("kind", [
  /** Footage or a painting filling the screen, with words at the bottom so the picture stays clear. */
  z.object({ kind: z.literal("art"), ...shot, art: z.enum(VIDEO_ART).optional(), eyebrow: words.optional(), title: words.optional(), line: words.optional() }),
  /** Words on their own, e.g. a blessing or "Save the date". */
  z.object({ kind: z.literal("title"), ...shot, eyebrow: words.optional(), title: words, line: words.optional() }),
  /** The names, written out in the script font. */
  z.object({ kind: z.literal("names"), ...shot, eyebrow: words.optional(), first: words, second: words.optional(), joiner: z.string().max(12).optional(), line: words.optional() }),
  /** One photo in the design's frame. Skipped when the customer has fewer photos. */
  z.object({ kind: z.literal("photo"), ...shot, photo: z.number().int().min(0), caption: words.optional() }),
  /** Every photo from this one on, one after another. */
  z.object({ kind: z.literal("gallery"), ...clip, from: z.number().int().min(0), caption: words.optional(), perPhoto: z.number().min(1.5).max(6).optional() }),
  /** The family lines, from the families field. */
  z.object({ kind: z.literal("families"), ...shot, eyebrow: words.optional() }),
  /** The date, large, with the day and time. */
  z.object({ kind: z.literal("date"), ...shot, eyebrow: words.optional(), line: words.optional() }),
  /** The venue name and address. */
  z.object({ kind: z.literal("venue"), ...shot, eyebrow: words.optional() }),
  /** The functions, "Event | When | Where" per line, up to 6: one screen each, or all on one list. */
  z.object({ kind: z.literal("events"), ...clip, eyebrow: words.optional(), title: words.optional(), each: z.boolean().optional(), perEvent: z.number().min(2.5).max(8).optional() }),
  /** A short note from a text field. */
  z.object({ kind: z.literal("message"), ...shot, eyebrow: words.optional(), field: z.string() }),
  /** The last screen. */
  z.object({ kind: z.literal("closing"), ...shot, title: words, line: words.optional(), signoff: words.optional() }),
]);
export type VideoScene = z.infer<typeof videoSceneSchema>;

export const videoSchema = z.object({
  ornament: z.enum(VIDEO_ORNAMENTS),
  particles: z.enum(VIDEO_PARTICLES),
  /** The shape photos are framed in. */
  frame: z.enum(["arch", "circle", "rounded", "polaroid"]),
  /** Background: top and bottom colours, and a soft glow behind the words. */
  sky: z.tuple([color, color]),
  glow: color,
  /** Language for dates and month names. */
  lang: z.enum(["en", "hi"]).optional(),
  scenes: z.array(videoSceneSchema).min(3).max(16),
});
export type VideoDesign = z.infer<typeof videoSchema>;

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
    /**
     * Price steps by number of photos, e.g. 2 photos included, 4 photos +₹50.
     * The customer pays the smallest step that fits their photos. Without
     * tiers the price is the same for any number of photos.
     */
    photoTiers: z.array(z.object({ photos: z.number().int().positive(), addMinor: z.number().int().min(0) })).min(1).max(10).optional(),
    music: z.object({ default: z.string() }),
    /** Classic step-by-step scenes, one scrolling page of chapters ("story"), or a video to download ("video"). */
    layout: z.enum(["scenes", "story", "video"]).default("scenes"),
    scenes: z.array(sceneSchema).default([]),
    story: storySchema.optional(),
    video: videoSchema.optional(),
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
        if (c.type === "memory" && c.pairs > t.photos.max) ctx.addIssue({ code: "custom", message: "The memory game needs more pairs than the template takes photos" });
        for (const k of ["field" in c ? c.field : undefined].filter(Boolean) as string[]) {
          if (!keys.has(k)) ctx.addIssue({ code: "custom", message: `Chapter ${c.type} reads unknown field ${k}` });
        }
      }
    }
    if (t.layout === "video") {
      if (!t.video) ctx.addIssue({ code: "custom", message: "A video template needs a video" });
      for (const s of t.video?.scenes ?? []) {
        if (s.kind === "message" && !keys.has(s.field)) ctx.addIssue({ code: "custom", message: `Video scene message reads unknown field ${s.field}` });
        if (s.kind === "photo" && s.photo >= t.photos.max) ctx.addIssue({ code: "custom", message: "A video photo scene uses a photo slot beyond the maximum" });
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
    if (t.photoTiers) {
      const tiers = t.photoTiers;
      if (tiers[0].photos !== t.photos.min) ctx.addIssue({ code: "custom", message: "The first photo tier must be the minimum number of photos" });
      if (tiers[tiers.length - 1].photos !== t.photos.max) ctx.addIssue({ code: "custom", message: "The last photo tier must be the maximum number of photos" });
      if (tiers[0].addMinor !== 0) ctx.addIssue({ code: "custom", message: "The first photo tier is included in the price, so it adds nothing" });
      for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].photos <= tiers[i - 1].photos) ctx.addIssue({ code: "custom", message: "Photo tiers must go up in number of photos" });
        if (tiers[i].addMinor < tiers[i - 1].addMinor) ctx.addIssue({ code: "custom", message: "A photo tier can't cost less than a smaller one" });
      }
    }
  });
export type TemplateConfig = z.infer<typeof templateConfigSchema>;
export type TemplateInput = z.input<typeof templateConfigSchema>;

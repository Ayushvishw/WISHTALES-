import type { Chapter, TemplateConfig, TemplateField, TemplateInput } from "../schema";
import { fields } from "./fields";

/**
 * Lists that state facts about the couple (what happened, what was promised,
 * what the treats are). The customer must write these: the template's lines
 * are shown on the form only as examples. Value: the fewest lines needed.
 */
const FACT_LISTS: Record<string, number> = { wishes: 3, milestones: 3, quiz: 2, reasons: 3, promises: 3, treats: 3, secret_notes: 3 };

/** Hero wish labels, worded for what they pop. */
const POP: Record<string, string> = { balloons: "balloons", bubbles: "bubbles", lanterns: "lanterns", hearts: "hearts" };

/**
 * Makes every word a story shows come from the customer's form. Facts (dates,
 * milestones, quiz answers, reasons, promises, treats, wishes, secrets) are
 * required fields with examples. Feelings (the one-answer question, the stars
 * message, the love meter steps) keep the template's words as editable defaults.
 */
export function editableGames(t: TemplateInput): TemplateInput {
  if (t.layout !== "story" || !t.story) return t;
  const list: TemplateField[] = [...(t.fields ?? [])].map((f) => ({ required: false, ...f }) as TemplateField);
  const find = (key: string) => list.find((f) => f.key === key);
  const add = (key: string, override: Partial<TemplateField> = {}) => {
    const have = find(key);
    if (have) Object.assign(have, override);
    else list.push(...fields({ key, ...override }));
  };
  const chapters = t.story.chapters.map((c): Chapter => {
    if (c.type === "hero" && c.floaters !== "none" && !c.field) {
      const what = POP[c.floaters];
      add("wishes", {
        label: `Little wishes inside the ${what} (one per line)`,
        help: `One pops up each time they tap the ${what}. Small promises or wishes from you, 3 to 6 lines.`,
      });
      return { ...c, field: "wishes" };
    }
    if (c.type === "question" && !c.title.includes("{{")) {
      add("fun_question", { default: c.title });
      add("fun_answer", { default: c.yes });
      return { ...c, title: "{{fun_question}}", yes: "{{fun_answer}}" };
    }
    if (c.type === "stars" && !c.reveal.includes("{{")) {
      add("stars_line", { default: c.reveal });
      return { ...c, reveal: "{{stars_line}}" };
    }
    if (c.type === "meter" && !c.field) {
      add("meter_levels");
      return { ...c, field: "meter_levels" };
    }
    if (c.type === "gallery" && c.captions?.length && !c.field) {
      add("photo_captions", { placeholder: c.captions.join("\n") });
      return { ...c, field: "photo_captions" };
    }
    if (c.type === "flips" && !c.field) {
      const key = find("reasons") ? "secret_notes" : "reasons";
      add(key);
      return { ...c, field: key };
    }
    return c;
  });
  for (const c of chapters) {
    const examples = c.type === "hero" ? c.wishes : "items" in c ? c.items : undefined;
    const key = "field" in c ? c.field : undefined;
    if (key && key in FACT_LISTS && examples) {
      const f = find(key)!;
      Object.assign(f, { required: true, minLines: FACT_LISTS[key], placeholder: examples.slice(0, 6).join("\n"), default: undefined });
      if (key === "quiz") f.pipes = 2;
    }
    // A counter can only count from the customer's own date.
    if (c.type === "counter") Object.assign(find(c.field)!, { required: true });
    // The scratch card hides the customer's own secret, never ours.
    if (c.type === "scratch") {
      const m = /\{\{(\w+)\}\}/.exec(c.reveal);
      if (m && find(m[1])) Object.assign(find(m[1])!, { required: true, default: undefined });
    }
  }
  return { ...t, fields: list, story: { ...t.story, chapters } };
}

/** Editable default words for each field, shown on the form with an "Edit these words" link. Facts have none. */
export function builtinLines(t: TemplateConfig): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of t.story?.chapters ?? []) {
    if (c.type === "meter" && c.field) out[c.field] ??= c.levels.join("\n");
  }
  return out;
}

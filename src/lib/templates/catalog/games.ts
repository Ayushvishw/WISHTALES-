import type { Chapter, TemplateConfig, TemplateField, TemplateInput } from "../schema";
import { fields } from "./fields";

/**
 * Makes the words inside every game something the customer can change on the
 * form. The template's own words become the defaults, so leaving a field empty
 * still gives a finished story.
 */
export function editableGames(t: TemplateInput): TemplateInput {
  if (t.layout !== "story" || !t.story) return t;
  const have = new Set((t.fields ?? []).map((f) => f.key));
  const added: TemplateField[] = [];
  const add = (key: string, override: Partial<TemplateField> = {}) => {
    if (have.has(key)) return false;
    have.add(key);
    added.push(...fields({ key, ...override }));
    return true;
  };
  const chapters = t.story.chapters.map((c): Chapter => {
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
    if (c.type === "flips" && !c.field) {
      const key = have.has("reasons") ? "secret_notes" : "reasons";
      add(key);
      return { ...c, field: key };
    }
    return c;
  });
  return { ...t, fields: [...(t.fields ?? []), ...added], story: { ...t.story, chapters } };
}

/** The template's own lines for each list field, shown on the form so customers see what they are changing. */
export function builtinLines(t: TemplateConfig): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of t.story?.chapters ?? []) {
    if (!("field" in c) || !c.field || c.type === "letter" || c.type === "counter") continue;
    const items = c.type === "meter" ? c.levels : c.items;
    out[c.field] ??= items.join("\n");
  }
  return out;
}

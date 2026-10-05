import type { TemplateConfig } from "./templates/schema";

export type Values = Record<string, string>;
export type FieldErrors = Record<string, string>;

/** Strip control characters and surrounding whitespace from customer text. */
export function cleanText(v: unknown, multiline = false): string {
  const s = String(v ?? "");
  const re = multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return s.replace(re, "").replace(/\r\n?/g, "\n").trim();
}

/**
 * Keep only the keys the template defines and normalize them. Unknown keys are
 * dropped, so a client can never smuggle extra data into an experience.
 */
export function sanitizeValues(t: TemplateConfig, input: Record<string, unknown>): Values {
  const out: Values = {};
  for (const f of t.fields) {
    if (!(f.key in input)) continue;
    out[f.key] = cleanText(input[f.key], f.type === "textarea");
  }
  return out;
}

/** Validates values against the template's field rules. Same code runs in the browser and on the server. */
export function validateValues(t: TemplateConfig, values: Values): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of t.fields) {
    const v = (values[f.key] ?? "").trim();
    if (!v) {
      if (f.required && !f.default) errors[f.key] = `Add ${f.label.toLowerCase()}.`;
      continue;
    }
    if (f.type === "number") {
      const n = Number(v);
      if (!Number.isFinite(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) {
        errors[f.key] = `Use a number from ${f.min ?? 0} to ${f.max ?? "any"}.`;
      }
    } else if (f.type === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) errors[f.key] = "Use a valid date.";
    } else if (f.max && v.length > f.max) {
      errors[f.key] = `Keep it under ${f.max} characters.`;
    }
  }
  return errors;
}

export function validatePhotoCount(t: TemplateConfig, count: number): string | null {
  if (count < t.photos.min) return `Add at least ${t.photos.min} photos (you have ${count}).`;
  if (count > t.photos.max) return `This template takes up to ${t.photos.max} photos.`;
  return null;
}

/** Values with template defaults applied to empty optional fields. */
export function resolveValues(t: TemplateConfig, values: Values): Values {
  const out: Values = {};
  for (const f of t.fields) {
    const v = (values[f.key] ?? "").trim();
    out[f.key] = v || f.default || "";
  }
  return out;
}

/**
 * Resolve {{placeholders}} in template text. Returns plain text (React escapes
 * it on render). A placeholder with no value is removed together with the
 * comma or separator in front of it, so "From {{a}}, {{b}}" becomes "From Aarav".
 */
export function fillText(str: string, values: Values): string {
  return str
    .replace(/\s*[,·]?\s*\{\{(\w+)\}\}/g, (m, k: string) => {
      const v = (values[k] ?? "").trim();
      if (!v) return "";
      return m.replace(`{{${k}}}`, v);
    })
    .trim();
}

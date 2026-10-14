const cleanText = (v: unknown) => String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim();

/** The ceremonies of an Indian wedding (plus a custom one), each with its own look in the video. */
export const FUNCTION_KINDS = [
  { kind: "roka", en: "Roka", hi: "रोका", time: "11:00 am", dress: "Festive ethnic" },
  { kind: "engagement", en: "Engagement", hi: "सगाई", time: "7:00 pm", dress: "Pastel formals" },
  { kind: "ganesh", en: "Ganesh Puja", hi: "गणेश पूजा", time: "9:00 am", dress: "Traditional" },
  { kind: "mehendi", en: "Mehendi", hi: "मेहंदी", time: "4:00 pm", dress: "Green and yellow" },
  { kind: "haldi", en: "Haldi", hi: "हल्दी", time: "10:00 am", dress: "Yellow" },
  { kind: "sangeet", en: "Sangeet", hi: "संगीत", time: "8:00 pm", dress: "Glam Indo-western" },
  { kind: "cocktail", en: "Cocktail Night", hi: "कॉकटेल नाइट", time: "8:00 pm", dress: "Black tie" },
  { kind: "baraat", en: "Baraat", hi: "बारात", time: "6:00 pm", dress: "Rich ethnic, turbans" },
  { kind: "wedding", en: "Pheras", hi: "फेरे", time: "9:00 pm", dress: "Traditional reds and golds" },
  { kind: "reception", en: "Reception", hi: "रिसेप्शन", time: "8:00 pm", dress: "Formal" },
  { kind: "custom", en: "Another function", hi: "अन्य कार्यक्रम", time: "", dress: "" },
] as const;
export type FunctionKind = (typeof FUNCTION_KINDS)[number]["kind"];

/** The order a wedding usually runs in, for the "add the usual functions" shortcut. */
export const USUAL: FunctionKind[] = ["mehendi", "haldi", "sangeet", "baraat", "wedding", "reception"];

export type WeddingFunction = { kind: FunctionKind; name?: string; date: string; time?: string; venue?: string; address?: string; dress?: string };

export const MAX_FUNCTIONS = 8;
const LIMITS = { name: 30, time: 40, venue: 80, address: 120, dress: 60 };

export function kindInfo(kind: string) {
  return FUNCTION_KINDS.find((k) => k.kind === kind) ?? FUNCTION_KINDS[FUNCTION_KINDS.length - 1];
}

/** The name shown for a function, in the video's language. */
export function functionName(f: Pick<WeddingFunction, "kind" | "name">, lang: "en" | "hi" = "en"): string {
  if (f.kind === "custom" || f.name) return (f.name || "").trim() || kindInfo(f.kind)[lang];
  return kindInfo(f.kind)[lang];
}

const isYmd = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/** Reads the stored text; bad input gives an empty list, never an error. */
export function parseFunctions(raw: string | undefined): WeddingFunction[] {
  if (!raw?.trim()) return [];
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(data)) return [];
  const out: WeddingFunction[] = [];
  for (const d of data.slice(0, MAX_FUNCTIONS)) {
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    const kind = FUNCTION_KINDS.some((k) => k.kind === o.kind) ? (o.kind as FunctionKind) : "custom";
    const s = (k: keyof typeof LIMITS) => cleanText(o[k]).slice(0, LIMITS[k]) || undefined;
    out.push({ kind, name: s("name"), date: isYmd(o.date) ? o.date : "", time: s("time"), venue: s("venue"), address: s("address"), dress: s("dress") });
  }
  return out;
}

export function serializeFunctions(list: WeddingFunction[]): string {
  return list.length ? JSON.stringify(list.slice(0, MAX_FUNCTIONS)) : "";
}

/** Problems with the list, or null when it is fine. */
export function functionsError(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const list = parseFunctions(raw);
  if (!list.length) return "These functions couldn't be read. Please add them again.";
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    if (!f.date) return `Pick a date for ${functionName(f)}.`;
    if (f.kind === "custom" && !f.name) return `Give function ${i + 1} a name.`;
  }
  return null;
}

/** Old invitations wrote functions as "Name | When | Where" lines; read those too. */
export function legacyFunctions(events: string | undefined): { name: string; when: string; where: string }[] {
  return (events ?? "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]).slice(0, 6)
    .map(([name, when = "", where = ""]) => ({ name, when, where: /^https?:/i.test(where) ? "" : where }));
}

/** What the video shows for one function. */
export type FunctionShow = { kind: FunctionKind; name: string; date: string; time: string; venue: string; address: string; dress: string };

export function functionShows(values: Record<string, string>, lang: "en" | "hi" = "en"): FunctionShow[] {
  const list = parseFunctions(values.functions).filter((f) => f.date || f.name || f.time);
  if (list.length) {
    const sorted = [...list].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
    return sorted.map((f) => ({
      kind: f.kind, name: functionName(f, lang), date: f.date, time: f.time ?? "",
      venue: f.venue || values.venue_name || "", address: f.address || (f.venue ? "" : values.venue_address || ""), dress: f.dress ?? "",
    }));
  }
  return legacyFunctions(values.events).map((e) => {
    const kind = (FUNCTION_KINDS.find((k) => k.en.toLowerCase() === e.name.toLowerCase() || k.hi === e.name)?.kind ?? "custom") as FunctionKind;
    return { kind, name: e.name, date: "", time: e.when, venue: e.where, address: "", dress: "" };
  });
}

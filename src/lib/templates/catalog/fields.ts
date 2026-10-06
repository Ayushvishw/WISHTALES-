import type { TemplateField } from "../schema";

type FieldInput = Omit<TemplateField, "required"> & { required?: boolean };

/** Shared field definitions. Templates pick from these and override per template. */
const F: Record<string, FieldInput> = {
  recipient_name: { key: "recipient_name", label: "Their name", type: "text", required: true, max: 30 },
  sender_name: { key: "sender_name", label: "Your name", type: "text", required: true, max: 30 },
  relationship: { key: "relationship", label: "What are you to them?", type: "text", max: 40, placeholder: "Best friend since Class 6" },
  event_date: { key: "event_date", label: "Birthday date", type: "date" },
  age: { key: "age", label: "Age they are turning", type: "number", min: 1, max: 120 },
  message: { key: "message", label: "Your message", type: "textarea", required: true, max: 420, help: "Short and specific works best. One thought per line." },
  secret_line: { key: "secret_line", label: "What the scratch card reveals", type: "text", required: true, max: 90, help: "A surprise, a plan, or something you have never said." },
  puzzle_line: { key: "puzzle_line", label: "Line shown when the photo puzzle is solved", type: "text", max: 90 },
  letter: { key: "letter", label: "Your letter", type: "textarea", required: true, max: 1500, help: "It types itself out like a real letter near the end. Write it the way you talk." },
  reasons: { key: "reasons", label: "Things you love about them (one per line)", type: "textarea", max: 600, help: "Up to 6 short lines. Leave it empty and we'll use sweet ones." },
  treats: { key: "treats", label: "Treats on the wheel (one per line)", type: "textarea", max: 220, help: "Up to 8 short treats, like \"Movie night\". Leave it empty to use ours." },
  since_date: { key: "since_date", label: "The day your story began", type: "date", help: "The day you met, first dated or got married. We count the days from here." },
  milestones: { key: "milestones", label: "Your story in steps (one per line)", type: "textarea", max: 700, help: "Write it as When | What happened, like \"June 2019 | We met at Priya's wedding\". Up to 6 lines. Leave it empty to use ours." },
  quiz: { key: "quiz", label: "Quiz questions (one per line)", type: "textarea", max: 700, help: "Write Question | right answer | wrong answer | wrong answer. Up to 5 lines. Leave it empty to use ours." },
  promises: { key: "promises", label: "Your promises (one per line)", type: "textarea", max: 600, help: "Up to 6 short promises. Leave it empty and we'll use sweet ones." },
  big_question: { key: "big_question", label: "The big question", type: "text", max: 60, default: "Will you marry me?", help: "Asked near the end. They can only say yes." },
  fun_question: { key: "fun_question", label: "The question with only one answer", type: "text", max: 70, help: "The No button runs away, so they can only pick your answer." },
  fun_answer: { key: "fun_answer", label: "The answer on the Yes button", type: "text", max: 30 },
  stars_line: { key: "stars_line", label: "What the stars spell out", type: "text", max: 70, help: "Shown when they finish joining the stars." },
  meter_levels: { key: "meter_levels", label: "Love meter steps (one per line)", type: "textarea", max: 260, help: "Shown as the meter fills, from a little to a lot. Leave it empty to use ours." },
  secret_notes: { key: "secret_notes", label: "Little secret notes (one per line)", type: "textarea", max: 600, help: "Up to 6 short notes they tap open. Leave it empty to use ours." },
  closing_line: { key: "closing_line", label: "The very last line they read", type: "text", max: 90, help: "People remember the ending most. Keep it short." },
};

export function fields(...spec: (string | (Partial<TemplateField> & { key: string }))[]): TemplateField[] {
  return spec.map((s) => {
    const base = typeof s === "string" ? F[s] : { ...F[s.key], ...s };
    if (!base) throw new Error(`Unknown field ${typeof s === "string" ? s : s.key}`);
    return { required: false, ...base } as TemplateField;
  });
}

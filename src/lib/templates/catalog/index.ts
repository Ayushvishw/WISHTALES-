import { templateConfigSchema, type TemplateConfig, type TemplateInput } from "../schema";
import { LOVE_TEMPLATES } from "./love";
import { STORY_TEMPLATES } from "./story";
import { fields } from "./fields";

/**
 * Version 1.0.0 of the three launch Birthday templates. Published versions are
 * immutable: to change one, add a new version and seed it, never edit in place.
 */
const classic: TemplateInput[] = [
  {
    slug: "bday-candlelight",
    version: "1.0.0",
    occasion: "birthday",
    name: "Candlelight",
    description: "A sealed letter in a candlelit room. Scratch to find a secret, then blow out the candles.",
    traits: ["Scratch-card puzzle", "Polaroid stack", "Candles ritual", "About 3 min"],
    priceMinor: 19900,
    currency: "INR",
    theme: {
      bg: "#1a1220", fg: "#f3e9dc", muted: "#b9a7b6", line: "#3a2c42", card: "#241a2b",
      accent: "#f2b45a", accent2: "#e48a9c", onAccent: "#1a1220", paper: "#f6ecdf", paperInk: "#2e1f28",
      display: "'Gloock', Georgia, serif", body: "'Figtree', system-ui, sans-serif",
      letter: "'Newsreader', Georgia, serif", hand: "'Homemade Apple', cursive",
      fx: ["#f2b45a", "#e48a9c", "#f6ecdf", "#ffd88a"],
    },
    fields: fields("recipient_name", "sender_name", "relationship", "event_date", "age", "message", "secret_line", {
      key: "closing_line",
      default: "Whatever this year brings, you won't face any of it alone.",
    }),
    photos: { min: 6, max: 8 },
    music: { default: "mus_hbd_box" },
    scenes: [
      { id: "intro", type: "hold", variant: "seal", title: "Someone has been saving up words for you, {{recipient_name}}.", hint: "Press and hold the seal" },
      { id: "greet", type: "greeting", title: "Happy birthday, {{recipient_name}}", sub: "From {{sender_name}}, {{relationship}}", showAge: true },
      { id: "photos", type: "photos", layout: "stack", title: "A few of my favourite moments of you" },
      { id: "puzzle", type: "puzzle", puzzle: "scratch", photos: [0], title: "Scratch the card", hint: "Use your finger to uncover it", reveal: "{{secret_line}}", fallbackAfter: 9 },
      { id: "message", type: "message" },
      { id: "wish", type: "ritual", ritual: "candles", title: "Close your eyes. Make a wish." },
      { id: "end", type: "closing" },
    ],
  },
  {
    slug: "bday-memory-lane",
    version: "1.0.0",
    occasion: "birthday",
    name: "Memory Lane",
    description: "Bright and playful. Unwrap a gift, scroll a film strip of photos, and piece one back together.",
    traits: ["Photo jigsaw", "Film strip", "Candles ritual", "About 3 min"],
    priceMinor: 24900,
    currency: "INR",
    theme: {
      bg: "#f3f1fb", fg: "#1e1d3a", muted: "#5f5d80", line: "#d9d6ee", card: "#ffffff",
      accent: "#3d5fd9", accent2: "#ffc93c", onAccent: "#ffffff", paper: "#ffffff", paperInk: "#1e1d3a",
      display: "'Caprasimo', Georgia, serif", body: "'Figtree', system-ui, sans-serif",
      letter: "'Figtree', system-ui, sans-serif", hand: "'Caprasimo', Georgia, serif",
      fx: ["#3d5fd9", "#ffc93c", "#ff6f91", "#4cc9a6"],
    },
    fields: fields(
      "recipient_name", "sender_name", "relationship", "event_date", "message",
      { key: "puzzle_line", default: "You're the best part of every picture." },
      { key: "closing_line", default: "Here's to a year as bright as you are." },
    ),
    photos: { min: 6, max: 8 },
    music: { default: "mus_warm_keys" },
    scenes: [
      { id: "intro", type: "hold", variant: "gift", title: "A little something for {{recipient_name}}", hint: "Press and hold to unwrap" },
      { id: "greet", type: "greeting", title: "Happy birthday, {{recipient_name}}!", sub: "Love, {{sender_name}}" },
      { id: "photos", type: "photos", layout: "film", title: "Swipe through the year" },
      { id: "puzzle", type: "puzzle", puzzle: "swap", photos: [1], title: "One photo got mixed up", hint: "Tap two tiles to swap them", reveal: "{{puzzle_line}}", fallbackAfter: 12 },
      { id: "wish", type: "ritual", ritual: "candles", title: "Your turn. Make a wish!" },
      { id: "message", type: "message" },
      { id: "end", type: "closing" },
    ],
  },
  {
    slug: "bday-starry-wish",
    version: "1.0.0",
    occasion: "birthday",
    name: "Starry Wish",
    description: "A quiet night sky. Match memories hidden in the stars and send a wish on a shooting star.",
    traits: ["Memory match game", "Polaroid stack", "Shooting-star ritual", "About 4 min"],
    priceMinor: 29900,
    currency: "INR",
    theme: {
      bg: "#0d1530", fg: "#eef2ff", muted: "#9aa6cc", line: "#24315a", card: "#16214a",
      accent: "#9fd3ff", accent2: "#ffd56a", onAccent: "#0d1530", paper: "#eef2ff", paperInk: "#121a38",
      display: "'Cormorant', Georgia, serif", body: "'Figtree', system-ui, sans-serif",
      letter: "'Cormorant', Georgia, serif", hand: "'Cormorant', Georgia, serif",
      fx: ["#ffd56a", "#9fd3ff", "#ffffff"],
    },
    fields: fields(
      "recipient_name", "sender_name", "relationship", { key: "event_date", required: true }, "message",
      { key: "closing_line", required: true, default: "Every star tonight is out for you." },
    ),
    photos: { min: 6, max: 8 },
    music: { default: "mus_warm_keys" },
    scenes: [
      { id: "intro", type: "hold", variant: "star", title: "The sky saved a star for {{recipient_name}}", hint: "Press and hold the star" },
      { id: "greet", type: "greeting", title: "Happy birthday, {{recipient_name}}", sub: "With love from {{sender_name}}" },
      { id: "puzzle", type: "puzzle", puzzle: "match", photos: [0, 1, 2, 3], title: "Find the matching memories", hint: "Turn two cards at a time", fallbackAfter: 20 },
      { id: "photos", type: "photos", layout: "stack", title: "Constellations of you" },
      { id: "message", type: "message" },
      { id: "wish", type: "ritual", ritual: "star", title: "Hold the star. Think of your wish." },
      { id: "end", type: "closing" },
    ],
  },
];

/** The three launch templates are kept so paid orders still render, but no longer sold. */
export const RETIRED_TEMPLATES = classic.map((t) => t.slug);

export const CATALOG: TemplateConfig[] = [...STORY_TEMPLATES, ...LOVE_TEMPLATES, ...classic].map((t) => templateConfigSchema.parse(t));

export const OCCASIONS = [
  { slug: "birthday", name: "Birthday", live: true },
  { slug: "anniversary", name: "Anniversary", live: true },
  { slug: "friendship", name: "Friendship", live: false },
  { slug: "proposal", name: "Love & Proposal", live: true },
  { slug: "wedding", name: "Wedding", live: false },
  { slug: "mothers-day", name: "Mother's Day", live: false },
  { slug: "fathers-day", name: "Father's Day", live: false },
] as const;

/** Music is a separate layer: templates and orders store only an id. */
export const MUSIC = [
  { id: "mus_hbd_box", title: "Happy Birthday, music box", source: "builtin:hbd", license: "Public-domain melody, synthesized in the browser" },
  { id: "mus_warm_keys", title: "Warm keys", source: "builtin:chords", license: "Original, royalty-free" },
  { id: "mus_canon", title: "Canon in D, music box", source: "builtin:canon", license: "Public-domain melody (Pachelbel), synthesized in the browser" },
  { id: "mus_custom", title: "Your own song", source: "custom", license: "A song you upload. Please only use music you have the right to share." },
  { id: "mus_none", title: "No music", source: "none", license: "n/a" },
] as const;

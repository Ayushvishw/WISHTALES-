import type { TemplateInput } from "../schema";
import { fields } from "./fields";

/**
 * Video invitations (v1.0.0): the customer fills a short form, watches the video
 * play with their details, and downloads an MP4 to send on WhatsApp or post. No
 * link and nothing for guests to tap. Designs whose scenes name a `clip` play that
 * footage (public/video/clips) under the words; the first clips are our own
 * paintings brought to life, to be replaced by AI-made footage under the same names.
 */

const common = { version: "1.0.0", occasion: "invitations", currency: "INR" as const, layout: "video" as const, scenes: [] };
const PHOTOS = { min: 0, max: 6 };

const WEDDING_FIELDS = fields(
  "couple_one", "couple_two", "invitation_from", "families", "event_day", "event_time", "venue_name", "venue_address",
  { key: "events", required: false, help: "Each function gets its own screen. Write Function | Day and time | Place, up to 6 lines. Leave it empty for a single-day invite." },
  "contact", "guests",
);

const GOLD_FONTS = "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Great+Vibes&family=Jost:wght@400;500;600&family=Tiro+Devanagari+Hindi";

export const VIDEO_TEMPLATES: TemplateInput[] = [
  /* ───────────── Shahi Vivah: the film ───────────── */
  {
    ...common,
    slug: "vid-shahi-vivah",
    name: "Shahi Vivah",
    description: "A royal wedding film. It opens on Lord Ganesha, follows the couple in, the varmala and the pheras, with every function on its own screen.",
    traits: ["Wedding film", "Ganesha opening", "Each function on its own screen", "About 45 seconds"],
    priceMinor: 44900,
    theme: {
      bg: "#1a0b10", fg: "#fbf1e1", muted: "#e6d2b8", line: "#3a2028", card: "#2a1218",
      accent: "#d9a84e", accent2: "#c2415a", accent3: "#f6d98f", onAccent: "#1a0b10", paper: "#fff8ec", paperInk: "#2a1218",
      display: "'Cormorant Garamond', 'Tiro Devanagari Hindi', Georgia, serif", hand: "'Great Vibes', 'Tiro Devanagari Hindi', cursive",
      body: "'Jost', 'Tiro Devanagari Hindi', system-ui, sans-serif", letter: "'Cormorant Garamond', 'Tiro Devanagari Hindi', Georgia, serif",
      fx: ["#d9a84e", "#f6d98f", "#c2415a"], fonts: GOLD_FONTS,
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    music: { default: "mus_canon" },
    video: {
      ornament: "arch", particles: "petals", frame: "arch", sky: ["#2a0f18", "#10050a"], glow: "#7a2a35",
      scenes: [
        { kind: "art", clip: "ganesha-1", seconds: 5, eyebrow: "॥ श्री गणेशाय नमः ॥", title: "With his blessings", line: "we begin the most special day of our lives" },
        { kind: "names", clip: "couple-1", seconds: 6, eyebrow: "The wedding of", first: "{{couple_one}}", second: "{{couple_two}}", line: "request the pleasure of your company" },
        { kind: "families", seconds: 5, eyebrow: "With the blessings of" },
        { kind: "date", clip: "couple-2", eyebrow: "Save the date" },
        { kind: "events", each: true, eyebrow: "Join us for the", perEvent: 4.5 },
        { kind: "gallery", from: 0, caption: "Us", perPhoto: 2.6 },
        { kind: "venue", clip: "pheras-1", eyebrow: "The venue" },
        { kind: "closing", title: "Warm regards", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },

  /* ───────────── Ivory Arch: light and calm ───────────── */
  {
    ...common,
    slug: "vid-ivory-arch",
    name: "Ivory Arch",
    description: "Soft ivory, a carved gold arch and drifting blush petals. Calm, classic and easy to read, with each function on its own screen.",
    traits: ["Wedding", "Light and elegant", "Each function on its own screen", "About 40 seconds"],
    priceMinor: 29900,
    theme: {
      bg: "#fbf5ee", fg: "#3b2a2a", muted: "#7c6560", line: "#ead9cc", card: "#f4e7dc",
      accent: "#b88a3e", accent2: "#e7a1a9", accent3: "#9c6d2a", onAccent: "#ffffff", paper: "#ffffff", paperInk: "#3b2a2a",
      display: "'Cormorant Garamond', Georgia, serif", hand: "'Great Vibes', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#b88a3e", "#e7a1a9"], fonts: GOLD_FONTS,
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    music: { default: "mus_canon" },
    video: {
      ornament: "arch", particles: "petals", frame: "arch", sky: ["#fffaf4", "#f6e6dc"], glow: "#ffe3dc",
      scenes: [
        { kind: "title", seconds: 4.5, eyebrow: "Mark your calendar", title: "to rejoice in the wedding of", line: "" },
        { kind: "names", seconds: 6, eyebrow: "", first: "{{couple_one}}", second: "{{couple_two}}", line: "with the blessings of our families" },
        { kind: "families", seconds: 5, eyebrow: "Together with" },
        { kind: "date", eyebrow: "Save the date" },
        { kind: "events", each: true, eyebrow: "", perEvent: 4.5 },
        { kind: "gallery", from: 0, caption: "Two hearts, one story", perPhoto: 2.6 },
        { kind: "venue", eyebrow: "Venue" },
        { kind: "closing", title: "Warm regards", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },

  /* ───────────── Midnight Gold: art deco evening ───────────── */
  {
    ...common,
    slug: "vid-midnight-gold",
    name: "Midnight Gold",
    description: "Black and gold art deco, shimmering light and slow sparkle. Made for a reception, sangeet or cocktail night.",
    traits: ["Reception or sangeet", "Art deco glamour", "Your photos in gold frames", "About 35 seconds"],
    priceMinor: 34900,
    theme: {
      bg: "#0b0b0d", fg: "#f6efe0", muted: "#bdb3a1", line: "#2a2722", card: "#16151a",
      accent: "#d4af37", accent2: "#8c6d1f", accent3: "#f3d98b", onAccent: "#0b0b0d", paper: "#f6efe0", paperInk: "#0b0b0d",
      display: "'Marcellus', Georgia, serif", hand: "'Pinyon Script', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#d4af37", "#f3d98b"], fonts: "family=Marcellus&family=Pinyon+Script&family=Jost:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500",
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    music: { default: "mus_warm_keys" },
    video: {
      ornament: "deco", particles: "sparkles", frame: "rounded", sky: ["#151318", "#060607"], glow: "#4a3a12",
      scenes: [
        { kind: "title", seconds: 4.5, eyebrow: "An evening to remember", title: "You are invited", line: "to celebrate with us" },
        { kind: "names", seconds: 6, eyebrow: "In honour of", first: "{{couple_one}}", second: "{{couple_two}}", joiner: "and", line: "" },
        { kind: "photo", photo: 0, caption: "" },
        { kind: "date", eyebrow: "Save the evening" },
        { kind: "events", each: true, eyebrow: "", perEvent: 4 },
        { kind: "gallery", from: 1, caption: "", perPhoto: 2.4 },
        { kind: "venue", eyebrow: "Where" },
        { kind: "closing", title: "See you there", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },

  /* ───────────── Marigold Mehendi: haldi, mehendi, griha pravesh ───────────── */
  {
    ...common,
    slug: "vid-marigold",
    name: "Marigold",
    description: "Swaying marigold torans and falling petals in warm saffron. Bright and festive for a Haldi, Mehendi or Griha Pravesh.",
    traits: ["Haldi, Mehendi or Griha Pravesh", "Marigold torans", "Festive and warm", "About 35 seconds"],
    priceMinor: 29900,
    theme: {
      bg: "#fff6e6", fg: "#4a2408", muted: "#8a5a2c", line: "#f1d9b0", card: "#fdeccc",
      accent: "#c9771a", accent2: "#f4a024", accent3: "#a3420e", onAccent: "#ffffff", paper: "#ffffff", paperInk: "#4a2408",
      display: "'Yeseva One', 'Tiro Devanagari Hindi', Georgia, serif", hand: "'Kaushan Script', 'Tiro Devanagari Hindi', cursive",
      body: "'Nunito Sans', 'Tiro Devanagari Hindi', system-ui, sans-serif", letter: "'Lora', 'Tiro Devanagari Hindi', Georgia, serif",
      fx: ["#f39c12", "#f7c948", "#e8590c"], fonts: "family=Yeseva+One&family=Kaushan+Script&family=Nunito+Sans:wght@400;600&family=Lora:ital@0;1&family=Tiro+Devanagari+Hindi",
    },
    fields: fields(
      { key: "couple_one", label: "Name (or first name)", required: true },
      { key: "couple_two", label: "Second name (optional)", required: false },
      { key: "sender_name", label: "Invitation from", type: "text", required: true, max: 60, placeholder: "The Sharma family" },
      { key: "occasion_name", label: "What you're celebrating", type: "text", required: true, max: 30, placeholder: "Haldi ceremony", default: "Haldi ceremony" },
      "families", "event_day", "event_time", "venue_name", "venue_address", "contact", "guests",
    ),
    photos: PHOTOS,
    music: { default: "mus_warm_keys" },
    video: {
      ornament: "toran", particles: "marigold", frame: "circle", sky: ["#fffaf0", "#fde3b6"], glow: "#ffe0a0",
      scenes: [
        { kind: "title", seconds: 4.5, eyebrow: "You're invited to the", title: "{{occasion_name}}", line: "" },
        { kind: "names", seconds: 5.5, eyebrow: "Celebrating", first: "{{couple_one}}", second: "{{couple_two}}", line: "" },
        { kind: "photo", photo: 0, caption: "" },
        { kind: "date", eyebrow: "When" },
        { kind: "gallery", from: 1, caption: "", perPhoto: 2.4 },
        { kind: "venue", eyebrow: "Where" },
        { kind: "families", seconds: 4.5, eyebrow: "With love from" },
        { kind: "closing", title: "Do come!", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },

  /* ───────────── Rose Ring: engagement ───────────── */
  {
    ...common,
    slug: "vid-rose-ring",
    name: "Rose Ring",
    description: "Blush, rose gold and gold-line florals for an engagement, roka or ring ceremony, with your photos in soft frames.",
    traits: ["Engagement or roka", "Blush and rose gold", "Your photos", "About 35 seconds"],
    priceMinor: 29900,
    theme: {
      bg: "#2a1420", fg: "#fbe9ef", muted: "#e1bfcc", line: "#4a2738", card: "#361b2a",
      accent: "#e3b18a", accent2: "#d987a0", accent3: "#f7d6c7", onAccent: "#2a1420", paper: "#fff6f7", paperInk: "#4a2034",
      display: "'Playfair Display', Georgia, serif", hand: "'Parisienne', cursive", body: "'Outfit', system-ui, sans-serif", letter: "'Lora', Georgia, serif",
      fx: ["#e3b18a", "#d987a0"], fonts: "family=Playfair+Display:ital,wght@0,500;1,500&family=Parisienne&family=Outfit:wght@400;500;600&family=Lora:ital@0;1",
    },
    fields: fields("couple_one", "couple_two", "invitation_from", "families", "event_day", "event_time", "venue_name", "venue_address", "contact", "guests"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    video: {
      ornament: "floral", particles: "bokeh", frame: "rounded", sky: ["#3a1a2a", "#160910"], glow: "#7a3550",
      scenes: [
        { kind: "title", seconds: 4.5, eyebrow: "Two hearts, one promise", title: "We're getting engaged", line: "" },
        { kind: "names", seconds: 6, eyebrow: "", first: "{{couple_one}}", second: "{{couple_two}}", line: "are exchanging rings" },
        { kind: "gallery", from: 0, caption: "", perPhoto: 2.6 },
        { kind: "families", seconds: 4.5, eyebrow: "With the blessings of" },
        { kind: "date", eyebrow: "Save the date" },
        { kind: "venue", eyebrow: "The ceremony" },
        { kind: "closing", title: "Be there with us", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },

  /* ───────────── Shubh Vivah in Hindi ───────────── */
  {
    ...common,
    slug: "vid-shubh-vivah-hindi",
    name: "शुभ विवाह",
    description: "The royal wedding film written in Hindi: श्री गणेश से शुरुआत, वर-वधू का आगमन, वरमाला और फेरे, and every function on its own screen. Type your details in Hindi.",
    traits: ["Hindi wedding film", "Ganesha opening", "Each function on its own screen", "About 45 seconds"],
    priceMinor: 44900,
    theme: {
      bg: "#1c0a06", fg: "#fff3e0", muted: "#ecd2b0", line: "#3c1f14", card: "#2a140c",
      accent: "#e0a84a", accent2: "#d2482c", accent3: "#ffd98a", onAccent: "#1c0a06", paper: "#fff8ec", paperInk: "#2a140c",
      display: "'Tiro Devanagari Hindi', Georgia, serif", hand: "'Rozha One', 'Tiro Devanagari Hindi', serif", body: "'Hind', 'Tiro Devanagari Hindi', system-ui, sans-serif", letter: "'Tiro Devanagari Hindi', Georgia, serif",
      fx: ["#e0a84a", "#ffd98a", "#d2482c"], fonts: "family=Tiro+Devanagari+Hindi:ital@0;1&family=Rozha+One&family=Hind:wght@400;600",
    },
    fields: fields(
      { key: "couple_one", label: "वधू का नाम (Bride)", placeholder: "सपना" },
      { key: "couple_two", label: "वर का नाम (Groom)", placeholder: "आकाश" },
      { key: "sender_name", label: "निमंत्रणकर्ता (Invitation from)", type: "text", required: true, max: 60, placeholder: "शर्मा परिवार" },
      { key: "families", label: "परिवार (Family lines, optional)", placeholder: "सुपुत्री श्रीमती मीना एवं श्री दिनेश शर्मा\nसुपुत्र श्रीमती गीता एवं श्री रोहन गुप्ता" },
      "event_day", { key: "event_time", label: "समय (Time)", placeholder: "सायं 7 बजे से" },
      { key: "venue_name", label: "स्थान (Venue)", placeholder: "राजमहल पैलेस" }, { key: "venue_address", label: "पता (Address)", placeholder: "जयपुर, राजस्थान" },
      { key: "events", required: false, label: "कार्यक्रम (Functions, one per line)", placeholder: "हल्दी | शुक्रवार, सुबह 10 बजे | लॉन\nसंगीत | शुक्रवार, रात 8 बजे | दरबार हॉल\nविवाह | शनिवार, सायं 7 बजे | राजमहल", help: "Function | Day and time | Place. Up to 6 lines." },
      { key: "contact", label: "संपर्क (Contact numbers, optional)" }, { key: "recipient_name", label: "Guests", type: "text", max: 40, default: "आप सभी" },
    ),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    video: {
      ornament: "mandala", particles: "marigold", frame: "arch", sky: ["#2c0e08", "#0e0403"], glow: "#8a3a1a", lang: "hi",
      scenes: [
        { kind: "art", clip: "ganesha-1", seconds: 5, eyebrow: "॥ श्री गणेशाय नमः ॥", title: "शुभ विवाह", line: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ" },
        { kind: "names", clip: "couple-1", seconds: 6, eyebrow: "सादर आमंत्रण", first: "{{couple_one}}", second: "{{couple_two}}", joiner: "संग", line: "के शुभ विवाह के पावन अवसर पर" },
        { kind: "families", seconds: 5, eyebrow: "आशीर्वाद सहित" },
        { kind: "date", clip: "couple-2", eyebrow: "शुभ मुहूर्त" },
        { kind: "events", each: true, eyebrow: "कार्यक्रम", perEvent: 4.5 },
        { kind: "gallery", from: 0, caption: "", perPhoto: 2.6 },
        { kind: "venue", clip: "pheras-1", eyebrow: "स्थान" },
        { kind: "closing", title: "सादर", line: "{{contact}}", signoff: "{{sender_name}}" },
      ],
    },
  },
];

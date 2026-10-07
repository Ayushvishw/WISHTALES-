import { DEFAULT_PHOTO_TIERS } from "@/lib/pricing";
import type { TemplateInput } from "../schema";
import { fields } from "./fields";

/**
 * Invitation templates (v1.0.0): an invitation card that opens like a gift,
 * a live countdown, the schedule with directions, the venue with "add to
 * calendar", a note from the hosts, replies (RSVP) and a wall of guests'
 * wishes. Every fact on the card comes from the customer's form.
 */

const common = { version: "1.0.0", occasion: "invitations", currency: "INR" as const, layout: "story" as const, scenes: [] };
const PHOTOS = { min: 2, max: 8 };
const photoTiers = DEFAULT_PHOTO_TIERS;

const WEDDING_FIELDS = fields(
  "couple_one", "couple_two", "invitation_from", "families", "event_day", "event_time", "venue_name", "venue_address", "map_link", "events", "note", "guests",
);

export const INVITATION_TEMPLATES: TemplateInput[] = [
  /* ───────────── Wedding 1 · Indian, marigold ───────────── */
  {
    ...common,
    slug: "inv-shubh-vivah",
    name: "Shubh Vivah",
    description: "Marigold, diyas and gold. Every function from Haldi to Reception with directions, a live countdown, and replies from every guest.",
    traits: ["Wedding", "All your functions", "Guest replies (RSVP)", "Wishes wall"],
    priceMinor: 69900,
    theme: {
      bg: "#3b0a0a", fg: "#fff3e0", muted: "#f1c9a5", line: "#5e1c14", card: "#4a1410",
      accent: "#ffb300", accent2: "#c62828", accent3: "#ffd54f", onAccent: "#3b0a0a", paper: "#fff8ec", paperInk: "#5a1a10",
      display: "'Cinzel', Georgia, serif", hand: "'Great Vibes', cursive", body: "'Poppins', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#ffb300", "#ff7043", "#ffd54f", "#c62828", "#fff8ec"],
      fonts: "family=Cinzel:wght@500;700&family=Great+Vibes&family=Poppins:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500",
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "desi",
      flow: "scroll",
      opener: { kind: "envelope", eyebrow: "Shubh Vivah", hint: "Tap the seal to open your invitation", sub: "With the blessings of our elders" },
      motif: "marigold",
      ambient: { orbs: ["#c62828", "#ffb300", "#7a1f0f"], particles: "petals", colors: ["#ffb300", "#ff7043", "#ffd54f"] },
      chapters: [
        { type: "invite", eyebrow: "Shubh Vivah", families: "{{families}}", intro: "Together with their families", names: "{{couple_one}} & {{couple_two}}", line: "request the pleasure of your company as they begin their forever" },
        { type: "countdown", eyebrow: "Counting the days", title: "Until we say yes, forever", field: "event_date", done: "Today is the day!" },
        { type: "events", eyebrow: "The celebrations", title: "Join us for every function", lead: "Tap Directions for the way to each one.", field: "events" },
        { type: "gallery", eyebrow: "Us", title: "A few moments of us", style: "frames" },
        { type: "venue", eyebrow: "Where", title: "The wedding venue" },
        { type: "letter", eyebrow: "From our families", title: "A note for you", lead: "Tap the scroll to open it.", style: "scroll", field: "letter" },
        { type: "rsvp", eyebrow: "Kindly reply", title: "Will you join us?", lead: "Let us know so we can save you a seat.", thanks: "Thank you! Your reply has reached the families." },
        { type: "wishes", eyebrow: "Blessings", title: "Wishes from our loved ones", empty: "Be the first to leave a blessing with your reply." },
        { type: "finale", eyebrow: "See you there", title: "We can't wait to celebrate with you", lead: "Tap for a little shower of petals.", button: "Shower the petals", headline: "See you at the wedding!", signoff: "With love, {{sender_name}}", effect: "petals" },
      ],
    },
  },

  /* ───────────── Wedding 2 · ivory and gold, classic ───────────── */
  {
    ...common,
    slug: "inv-ivory-vows",
    name: "Ivory Vows",
    description: "Ivory, soft gold and quiet elegance. A classic card, your day's schedule, a countdown and replies, with no clutter.",
    traits: ["Wedding", "Classic and minimal", "Guest replies (RSVP)", "Add to calendar"],
    priceMinor: 59900,
    theme: {
      bg: "#f7f1e8", fg: "#3b3128", muted: "#857565", line: "#e3d7c6", card: "#fffaf2",
      accent: "#b08d57", accent2: "#7a5c3a", accent3: "#d9c29a", onAccent: "#fffaf2", paper: "#fffdf8", paperInk: "#3b3128",
      display: "'Cormorant Garamond', Georgia, serif", hand: "'Pinyon Script', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#b08d57", "#d9c29a", "#ffffff", "#e8d5b5"],
      fonts: "family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Pinyon+Script&family=Jost:wght@400;500;600",
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_canon" },
    story: {
      skin: "timeless",
      flow: "scroll",
      opener: { kind: "envelope", eyebrow: "You're invited", hint: "Tap the seal to open", sub: "Sound on, if you can" },
      motif: "ring",
      ambient: { orbs: ["#e8d5b5", "#f3e7d3", "#d9c29a"], particles: "sparks", colors: ["#b08d57", "#d9c29a"] },
      chapters: [
        { type: "invite", eyebrow: "Save the date", families: "{{families}}", intro: "Together with their families", names: "{{couple_one}} & {{couple_two}}", line: "invite you to celebrate their wedding" },
        { type: "countdown", eyebrow: "The big day", title: "Not long now", field: "event_date", done: "Today we say I do" },
        { type: "gallery", eyebrow: "Our story", title: "A few of our favourite moments", style: "polaroid" },
        { type: "events", eyebrow: "The day", title: "Order of the day", field: "events" },
        { type: "venue", eyebrow: "The venue", title: "Where to find us" },
        { type: "letter", eyebrow: "From us", title: "A note for our guests", lead: "Tap the envelope to open it.", style: "envelope", field: "letter" },
        { type: "rsvp", eyebrow: "RSVP", title: "Will you be there?", lead: "Your reply helps us plan the day.", thanks: "Thank you. We've got your reply." },
        { type: "wishes", eyebrow: "Guestbook", title: "Kind words from our guests", empty: "Leave a few kind words with your reply." },
        { type: "finale", eyebrow: "Until then", title: "We can't wait to see you", lead: "Tap below.", button: "Celebrate", headline: "See you there", signoff: "{{sender_name}}", effect: "confetti" },
      ],
    },
  },

  /* ───────────── Wedding 3 · garden, swipe ───────────── */
  {
    ...common,
    slug: "inv-garden-wedding",
    name: "Garden Wedding",
    description: "Sage, blush and wildflowers. A swipe-through invitation, one page at a time, with the schedule, the venue and replies.",
    traits: ["Wedding", "Swipe like a story", "Guest replies (RSVP)", "Wishes wall"],
    priceMinor: 64900,
    theme: {
      bg: "#eef2ea", fg: "#2f3a2c", muted: "#6c7a66", line: "#d5ddcf", card: "#f8faf5",
      accent: "#7c9a6d", accent2: "#c9777f", accent3: "#e7b7a9", onAccent: "#ffffff", paper: "#fffdf9", paperInk: "#2f3a2c",
      display: "'Playfair Display', Georgia, serif", hand: "'Allura', cursive", body: "'Nunito Sans', system-ui, sans-serif", letter: "'Lora', Georgia, serif",
      fx: ["#7c9a6d", "#c9777f", "#e7b7a9", "#f6e3a1"],
      fonts: "family=Playfair+Display:wght@500;700&family=Allura&family=Nunito+Sans:wght@400;600&family=Lora:ital@0;1",
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_canon" },
    story: {
      skin: "garden",
      flow: "swipe",
      opener: { kind: "envelope", eyebrow: "A little note from the garden", hint: "Tap the envelope", sub: "Swipe through, page by page" },
      motif: "petal",
      ambient: { orbs: ["#c9777f", "#7c9a6d", "#e7b7a9"], particles: "petals", colors: ["#c9777f", "#e7b7a9", "#7c9a6d"] },
      chapters: [
        { type: "invite", eyebrow: "Join us", families: "{{families}}", intro: "With joy in our hearts", names: "{{couple_one}} & {{couple_two}}", line: "are getting married, and we'd love you there" },
        { type: "countdown", eyebrow: "Counting down", title: "Days until the garden party", field: "event_date", done: "It's our wedding day!" },
        { type: "gallery", eyebrow: "Us", title: "Blooming, together", style: "string" },
        { type: "events", eyebrow: "Schedule", title: "What's happening", field: "events" },
        { type: "venue", eyebrow: "Venue", title: "Find your way" },
        { type: "rsvp", eyebrow: "RSVP", title: "Can you make it?", thanks: "Lovely! We've got your reply." },
        { type: "wishes", eyebrow: "Love notes", title: "From our favourite people", empty: "Your wish could be the first one here." },
        { type: "letter", eyebrow: "One more thing", title: "A note from us", lead: "Tap the postcard.", style: "postcard", field: "letter" },
        { type: "finale", eyebrow: "See you soon", title: "Bring your dancing shoes", lead: "Tap for petals.", button: "Throw the petals", headline: "See you in the garden", signoff: "Love, {{sender_name}}", effect: "petals" },
      ],
    },
  },

  /* ───────────── Wedding 4 · emerald and gold ───────────── */
  {
    ...common,
    slug: "inv-emerald-nights",
    name: "Emerald Nights",
    description: "Deep emerald, lanterns and gold. Elegant for a Nikah, Walima or evening reception, with every event, the venue and replies.",
    traits: ["Wedding or reception", "Evening elegance", "Guest replies (RSVP)", "All your events"],
    priceMinor: 69900,
    theme: {
      bg: "#06261f", fg: "#f3ead7", muted: "#b8c4b2", line: "#164035", card: "#0b3329",
      accent: "#d4af37", accent2: "#0f6b55", accent3: "#f1d78a", onAccent: "#06261f", paper: "#fbf6ea", paperInk: "#0b3329",
      display: "'Marcellus', Georgia, serif", hand: "'Great Vibes', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#d4af37", "#f1d78a", "#0f6b55", "#fbf6ea"],
      fonts: "family=Marcellus&family=Great+Vibes&family=Jost:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500",
    },
    fields: WEDDING_FIELDS,
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "golden",
      flow: "scroll",
      opener: { kind: "envelope", eyebrow: "You are invited", hint: "Tap the seal to open", sub: "Sound on, if you can" },
      motif: "moon",
      ambient: { orbs: ["#0f6b55", "#d4af37", "#06261f"], particles: "fireflies", colors: ["#d4af37", "#f1d78a"] },
      chapters: [
        { type: "invite", eyebrow: "With the blessings of our families", families: "{{families}}", intro: "We joyfully invite you to the wedding of", names: "{{couple_one}} & {{couple_two}}", line: "Your presence will make our celebration complete" },
        { type: "countdown", eyebrow: "Counting the nights", title: "Until we celebrate", field: "event_date", done: "Tonight we celebrate" },
        { type: "events", eyebrow: "The celebrations", title: "Every event, every evening", field: "events" },
        { type: "venue", eyebrow: "Venue", title: "Where we gather" },
        { type: "gallery", eyebrow: "Moments", title: "A glimpse of us", style: "frames" },
        { type: "letter", eyebrow: "A note", title: "From our families to yours", lead: "Tap the scroll to unroll it.", style: "scroll", field: "letter" },
        { type: "rsvp", eyebrow: "Kindly reply", title: "Will you honour us with your presence?", thanks: "Thank you. Your reply has been received." },
        { type: "wishes", eyebrow: "Duas and wishes", title: "Words from our loved ones", empty: "Leave your wishes with your reply." },
        { type: "finale", eyebrow: "Until then", title: "We look forward to seeing you", lead: "Tap below.", button: "Light the lanterns", headline: "See you there", signoff: "{{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Engagement ───────────── */
  {
    ...common,
    slug: "inv-ring-ceremony",
    name: "Ring Ceremony",
    description: "Blush, rose gold and a ring box that opens. For an engagement or roka, with a countdown, the venue and replies.",
    traits: ["Engagement or roka", "Opens with a ring box", "Guest replies (RSVP)", "Wishes wall"],
    priceMinor: 49900,
    theme: {
      bg: "#2a1420", fg: "#fbe9ef", muted: "#d8b3c1", line: "#4a2738", card: "#361b2a",
      accent: "#e8a0b4", accent2: "#b76e79", accent3: "#f5d0c5", onAccent: "#2a1420", paper: "#fff6f7", paperInk: "#4a2034",
      display: "'Playfair Display', Georgia, serif", hand: "'Parisienne', cursive", body: "'Outfit', system-ui, sans-serif", letter: "'Lora', Georgia, serif",
      fx: ["#e8a0b4", "#f5d0c5", "#b76e79", "#ffffff"],
      fonts: "family=Playfair+Display:wght@500;700&family=Parisienne&family=Outfit:wght@400;500;600&family=Lora:ital@0;1",
    },
    fields: fields("couple_one", "couple_two", "invitation_from", "families", "event_day", "event_time", "venue_name", "venue_address", "map_link", "note", "guests"),
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_canon" },
    story: {
      skin: "blush",
      flow: "scroll",
      opener: { kind: "ringbox", eyebrow: "Something special", hint: "Tap the ring box", sub: "Sound on, if you can" },
      motif: "ring",
      ambient: { orbs: ["#b76e79", "#e8a0b4", "#5a2a3e"], particles: "sparks", colors: ["#e8a0b4", "#f5d0c5"] },
      chapters: [
        { type: "invite", eyebrow: "We're getting engaged", families: "{{families}}", intro: "Please join us as", names: "{{couple_one}} & {{couple_two}}", line: "exchange rings and begin a new chapter" },
        { type: "countdown", eyebrow: "Almost there", title: "Until the rings", field: "event_date", done: "Today's the day!" },
        { type: "gallery", eyebrow: "Us", title: "The two of us", style: "polaroid" },
        { type: "venue", eyebrow: "When and where", title: "The ceremony" },
        { type: "letter", eyebrow: "A note", title: "From us, to you", lead: "Tap the envelope.", style: "envelope", field: "letter" },
        { type: "rsvp", eyebrow: "RSVP", title: "Will you be there?", thanks: "Yay! We've got your reply." },
        { type: "wishes", eyebrow: "Wishes", title: "Love from our people", empty: "Send your wishes with your reply." },
        { type: "finale", eyebrow: "See you soon", title: "It wouldn't be the same without you", lead: "Tap for a little sparkle.", button: "Celebrate", headline: "See you there", signoff: "{{sender_name}}", effect: "hearts" },
      ],
    },
  },

  /* ───────────── Birthday party ───────────── */
  {
    ...common,
    slug: "inv-party-time",
    name: "Party Time",
    description: "Confetti, balloons and a big countdown. A birthday party invite with the venue, directions and who's coming.",
    traits: ["Birthday party", "Kids or grown-ups", "Guest replies (RSVP)", "Party countdown"],
    priceMinor: 39900,
    theme: {
      bg: "#1b1035", fg: "#fdf6ff", muted: "#c9b8e8", line: "#33235c", card: "#261749",
      accent: "#ffcc4d", accent2: "#ff5c8a", accent3: "#5ce1e6", onAccent: "#1b1035", paper: "#fffaf0", paperInk: "#2a1a4a",
      display: "'Fredoka', system-ui, sans-serif", hand: "'Pacifico', cursive", body: "'Nunito', system-ui, sans-serif", letter: "'Nunito', system-ui, sans-serif",
      fx: ["#ffcc4d", "#ff5c8a", "#5ce1e6", "#8f7bff", "#7bf1a8"],
      fonts: "family=Fredoka:wght@500;700&family=Pacifico&family=Nunito:wght@400;600;700",
    },
    fields: fields(
      { key: "recipient_name", label: "Whose birthday is it?", required: true },
      { key: "age", label: "Age they are turning", required: true },
      "invitation_from", "event_day", "event_time", "venue_name", "venue_address", "map_link", "note",
    ),
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_hbd_box" },
    story: {
      skin: "gala",
      flow: "scroll",
      opener: { kind: "gift", eyebrow: "You're invited!", hint: "Tap the gift to open", sub: "Turn your sound on" },
      motif: "sparkle",
      ambient: { orbs: ["#ff5c8a", "#5ce1e6", "#8f7bff"], particles: "confetti", colors: ["#ffcc4d", "#ff5c8a", "#5ce1e6"] },
      chapters: [
        { type: "invite", eyebrow: "Let's party", intro: "You're invited to celebrate", names: "{{recipient_name}}", line: "turning {{age}}! Come for cake, games and a lot of fun" },
        { type: "countdown", eyebrow: "Get ready", title: "Party starts in", field: "event_date", done: "It's party day!" },
        { type: "gallery", eyebrow: "The birthday star", title: "Look who's growing up", style: "polaroid" },
        { type: "venue", eyebrow: "Where", title: "The party place" },
        { type: "letter", eyebrow: "A note", title: "From the hosts", lead: "Tap the envelope.", style: "envelope", field: "letter" },
        { type: "rsvp", eyebrow: "RSVP", title: "Are you coming?", lead: "Tell us how many, so there's enough cake.", thanks: "Woohoo! See you at the party." },
        { type: "wishes", eyebrow: "Birthday wishes", title: "Wishes for the birthday star", empty: "Leave a birthday wish with your reply." },
        { type: "finale", eyebrow: "Don't be late", title: "It's going to be epic", lead: "Ready?", button: "Pop the confetti", headline: "See you at the party!", signoff: "{{sender_name}}", effect: "confetti" },
      ],
    },
  },

  /* ───────────── Housewarming ───────────── */
  {
    ...common,
    slug: "inv-new-home",
    name: "Our New Home",
    description: "Warm terracotta and fairy lights. A housewarming or Griha Pravesh invite with the address, directions and replies.",
    traits: ["Housewarming", "Griha Pravesh", "Guest replies (RSVP)", "Directions to the door"],
    priceMinor: 39900,
    theme: {
      bg: "#2b1a12", fg: "#fbefe3", muted: "#d9bfa8", line: "#4a3020", card: "#382419",
      accent: "#e07a3f", accent2: "#c2502a", accent3: "#f3c98b", onAccent: "#2b1a12", paper: "#fff8ef", paperInk: "#3d2416",
      display: "'Fraunces', Georgia, serif", hand: "'Caveat', cursive", body: "'Outfit', system-ui, sans-serif", letter: "'Fraunces', Georgia, serif",
      fx: ["#e07a3f", "#f3c98b", "#c2502a", "#fff8ef"],
      fonts: "family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Caveat:wght@600&family=Outfit:wght@400;500;600",
    },
    fields: fields(
      { key: "sender_name", label: "Your names (the hosts)", required: true, max: 60, placeholder: "Riya and Aarav" },
      "guests", "event_day", "event_time", { key: "venue_name", label: "Home name or flat number", placeholder: "Flat 702, Lake View Towers" }, "venue_address", "map_link", "note",
    ),
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "cafe",
      flow: "scroll",
      opener: { kind: "envelope", eyebrow: "We have news", hint: "Tap to open", sub: "Sound on, if you can" },
      motif: "key",
      ambient: { orbs: ["#e07a3f", "#c2502a", "#6b3a22"], particles: "fireflies", colors: ["#f3c98b", "#e07a3f"] },
      chapters: [
        { type: "invite", eyebrow: "Housewarming", intro: "We've found our happy place, and we'd love you to see it", names: "{{sender_name}}", line: "invite {{recipient_name}} to our new home" },
        { type: "countdown", eyebrow: "Doors open in", title: "Almost moving-in day", field: "event_date", done: "Doors are open today!" },
        { type: "gallery", eyebrow: "A sneak peek", title: "Our little corner of the world", style: "frames" },
        { type: "venue", eyebrow: "The address", title: "How to find us" },
        { type: "letter", eyebrow: "A note", title: "From our new home", lead: "Tap the envelope.", style: "envelope", field: "letter" },
        { type: "rsvp", eyebrow: "RSVP", title: "Will you drop by?", thanks: "Wonderful. We'll keep the chai ready." },
        { type: "wishes", eyebrow: "Blessings", title: "Wishes for our new home", empty: "Leave a blessing for the new home with your reply." },
        { type: "finale", eyebrow: "See you soon", title: "Come home with us", lead: "Tap below.", button: "Light up the home", headline: "See you at our new home", signoff: "{{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Baby shower / naming ceremony ───────────── */
  {
    ...common,
    slug: "inv-little-one",
    name: "Little One",
    description: "Soft pastels, clouds and stars. For a baby shower, godh bharai or naming ceremony, with the venue and replies.",
    traits: ["Baby shower", "Naming ceremony", "Guest replies (RSVP)", "Wishes for the baby"],
    priceMinor: 39900,
    theme: {
      bg: "#eef1fb", fg: "#3a3f5c", muted: "#7a809e", line: "#d9def2", card: "#f8f9ff",
      accent: "#8fa8ff", accent2: "#f29cb3", accent3: "#ffd88a", onAccent: "#ffffff", paper: "#ffffff", paperInk: "#3a3f5c",
      display: "'Quicksand', system-ui, sans-serif", hand: "'Dancing Script', cursive", body: "'Nunito', system-ui, sans-serif", letter: "'Quicksand', system-ui, sans-serif",
      fx: ["#8fa8ff", "#f29cb3", "#ffd88a", "#a8e6cf"],
      fonts: "family=Quicksand:wght@500;700&family=Dancing+Script:wght@600&family=Nunito:wght@400;600",
    },
    fields: fields(
      { key: "sender_name", label: "Parents' names", required: true, max: 60, placeholder: "Riya and Aarav" },
      { key: "couple_one", label: "What you're celebrating", type: "text", required: true, max: 40, placeholder: "Baby shower" },
      "guests", "event_day", "event_time", "venue_name", "venue_address", "map_link", "note",
    ),
    photos: PHOTOS,
    photoTiers,
    music: { default: "mus_canon" },
    story: {
      skin: "fairy",
      flow: "swipe",
      opener: { kind: "gift", eyebrow: "A little announcement", hint: "Tap to open", sub: "Swipe through, page by page" },
      motif: "star",
      ambient: { orbs: ["#8fa8ff", "#f29cb3", "#ffd88a"], particles: "bubbles", colors: ["#8fa8ff", "#f29cb3", "#ffd88a"] },
      chapters: [
        { type: "invite", eyebrow: "{{couple_one}}", intro: "Something little is on the way, and you're invited to celebrate with", names: "{{sender_name}}", line: "Join us for love, laughter and a few happy tears" },
        { type: "countdown", eyebrow: "Counting down", title: "Until we celebrate", field: "event_date", done: "It's today!" },
        { type: "gallery", eyebrow: "Moments", title: "Our journey so far", style: "polaroid" },
        { type: "venue", eyebrow: "Where", title: "Come celebrate with us" },
        { type: "rsvp", eyebrow: "RSVP", title: "Will you join us?", thanks: "Thank you! We can't wait to see you." },
        { type: "wishes", eyebrow: "Wishes", title: "Wishes for the little one", empty: "Leave a wish for the little one with your reply." },
        { type: "letter", eyebrow: "A note", title: "From the parents", lead: "Tap the postcard.", style: "postcard", field: "letter" },
        { type: "finale", eyebrow: "See you soon", title: "With love and a little excitement", lead: "Tap below.", button: "Send some love", headline: "See you there", signoff: "{{sender_name}}", effect: "hearts" },
      ],
    },
  },
];

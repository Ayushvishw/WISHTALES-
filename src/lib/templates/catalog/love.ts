import type { TemplateInput } from "../schema";
import { fields } from "./fields";

/**
 * Anniversary and Love & Proposal story templates (v1.0.0). Same idea as the
 * birthday stories (chapters with games, photos, a letter and a finale), with
 * love-story chapters on top: a days-together counter, a timeline, a love
 * meter, connect-the-stars, a bouquet, a couples quiz, promises, a love lock
 * and a ring box. "swipe" templates show one chapter per screen.
 */

const common = { version: "1.0.0", currency: "INR" as const, layout: "story" as const, scenes: [] };
const anni = { ...common, occasion: "anniversary" };
const prop = { ...common, occasion: "proposal" };
const PHOTOS = { min: 4, max: 8 };

const REASONS = [
  "The way you look at me when you think I'm not looking.",
  "You make every ordinary day feel like a little trip.",
  "You remember how I take my chai, and my bad days.",
  "You never let me give up on us.",
  "Your laugh is my favourite sound in the world.",
  "With you, home is a person, not a place.",
];

const MILESTONES = [
  "The day we met | You smiled first. I've been smiling since.",
  "Our first date | Two coffees, four hours, zero awkward silences.",
  "Our first trip | We got lost and called it an adventure.",
  "The hard days | We held on, and it made us stronger.",
  "Today | Still choosing you, every single morning.",
];

const PROMISES = [
  "to hold your hand through every storm",
  "to laugh at your jokes, even the old ones",
  "to make you chai on slow Sunday mornings",
  "to choose you again, every single day",
  "to always come home to you",
  "to stay your biggest fan, forever",
];

const QUIZ_ANNI = [
  "Where did we first meet? | At a friend's party | At the gym | On a train",
  "Who said \"I love you\" first? | You did | I did | We said it together",
  "What is our perfect date night? | Street food and a long walk | A fancy dinner | Staying in with a movie",
  "Who is the better cook? | You, obviously | Me | The delivery app",
  "What do I love most about you? | Everything | Your cooking | Your Wi-Fi password",
];

const QUIZ_PROP = [
  "Who fell in love first? | I did, the day we met | You did | It was mutual",
  "What was I thinking on our first date? | I hope this never ends | When is the food coming | Is my hair okay",
  "What is my favourite thing about you? | Your heart | Your playlist | Your snacks",
  "Where do I see us in ten years? | Together, somewhere happy | On Mars | Still deciding dinner",
];

const METER = ["Just a little crush…", "Butterflies, definitely", "Head over heels", "Completely, hopelessly in love", "Off the charts"];

const DATES = ["Picnic in the park", "Rooftop dinner", "Movie marathon", "Long drive", "Cooking date", "Stargazing", "Dance class", "Breakfast in bed"];

export const LOVE_TEMPLATES: TemplateInput[] = [
  /* ───────────── Anniversary 1 · scroll ───────────── */
  {
    ...anni,
    slug: "anni-forever-always",
    name: "Forever & Always",
    description: "Wine and champagne gold. Count every day together, walk through your story sideways, fill the love meter and read a letter on a scroll.",
    traits: ["For a husband or wife", "Days-together counter", "Love meter", "Scroll letter"],
    priceMinor: 29900,
    theme: {
      bg: "#1d0b12", fg: "#f8e9e4", muted: "#cfb2b0", line: "#3d1d27", card: "#2a111b",
      accent: "#e8b86a", accent2: "#c2185b", accent3: "#f6d7a7", onAccent: "#1d0b12", paper: "#fbf2e6", paperInk: "#3b1a24",
      display: "'Cormorant Garamond', Georgia, serif", hand: "'Parisienne', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#e8b86a", "#c2185b", "#f6d7a7", "#ff8fab", "#fbf2e6"],
      fonts: "family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500&family=Parisienne&family=Jost:wght@400;500;600",
    },
    fields: fields("recipient_name", "sender_name", { key: "since_date", required: true }, "letter", "milestones", "reasons"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "timeless",
      flow: "scroll",
      opener: { kind: "envelope", eyebrow: "For the love of my life", hint: "Tap the seal to open", sub: "Sound on, my love" },
      motif: "heart",
      ambient: { orbs: ["#c2185b", "#e8b86a", "#7b1f3a"], particles: "petals", colors: ["#e8b86a", "#ff8fab", "#f6d7a7"] },
      chapters: [
        { type: "hero", kicker: "Happy Anniversary", lead: "Another year of us. Pop the hearts for a few wishes I've saved for you.", floaters: "hearts", nameStyle: "script",
          wishes: ["A wish: a hundred more years of your laugh.", "Wish found: breakfast in bed, this Sunday.", "May we always find our way back to each other.", "Wish found: a slow dance in the kitchen.", "To more lazy mornings and late-night talks.", "Wish found: one very long hug from {{sender_name}}."] },
        { type: "counter", eyebrow: "Time flies", title: "Every day, still you", lead: "This is how long I've been the luckiest person alive.", field: "since_date", fallback: "Every single day since the day we met", done: "And I'd do every second again" },
        { type: "timeline", eyebrow: "Our story", title: "How we got here", lead: "One chapter at a time.", field: "milestones", items: MILESTONES },
        { type: "gallery", eyebrow: "Us", title: "Framed, like everything I treasure", style: "frames" },
        { type: "meter", eyebrow: "A little test", title: "How much do I love you?", lead: "Press and hold the button. Don't let go too soon.", levels: METER, done: "Infinity, and a little more" },
        { type: "flips", eyebrow: "Why you", title: "Reasons I'd marry you all over again", lead: "Tap each card.", field: "reasons", items: REASONS },
        { type: "letter", eyebrow: "For you", title: "My letter to you", lead: "Tap the scroll to unroll it.", style: "scroll", field: "letter" },
        { type: "finale", eyebrow: "Grand finale", title: "To us", lead: "Ready? Tap the button.", button: "Let it rain love", headline: "Happy Anniversary, {{recipient_name}}", signoff: "Forever yours, {{sender_name}}", effect: "hearts" },
      ],
    },
  },

  /* ───────────── Anniversary 2 · swipe ───────────── */
  {
    ...anni,
    slug: "anni-polaroid-diaries",
    name: "Polaroid Diaries",
    description: "A handwritten diary you swipe page by page. A couples quiz, photos pegged on a string, a secret to scratch and a postcard letter.",
    traits: ["Swipe like a story", "Couples quiz", "Photos on a string", "Postcard letter"],
    priceMinor: 24900,
    theme: {
      bg: "#f6efe2", fg: "#23395b", muted: "#5b6b84", line: "#e0d4bd", card: "#fffaf0",
      accent: "#e4572e", accent2: "#23395b", accent3: "#f2a541", onAccent: "#ffffff", paper: "#fffdf6", paperInk: "#23395b",
      display: "'Kalam', 'Comic Sans MS', cursive", hand: "'Caveat', cursive", body: "'Nunito', system-ui, sans-serif", letter: "'Kalam', cursive",
      fx: ["#e4572e", "#f2a541", "#23395b", "#79addc", "#ffc0cb"],
      fonts: "family=Kalam:wght@400;700&family=Caveat:wght@500;700&family=Nunito:wght@400;600;700",
    },
    fields: fields("recipient_name", "sender_name", "letter", "quiz", { key: "secret_line", label: "A secret for the scratch card", help: "A plan, a promise, or something you have never said." }, "milestones"),
    photos: PHOTOS,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "diary",
      flow: "swipe",
      opener: { kind: "gift", eyebrow: "Our diary, page one", hint: "Tap to open it", sub: "Swipe sideways to turn the pages" },
      motif: "heart",
      ambient: { orbs: ["#f2a541", "#e4572e", "#79addc"], particles: "confetti", colors: ["#e4572e", "#f2a541", "#79addc"] },
      chapters: [
        { type: "hero", kicker: "Happy Anniversary", lead: "Dear diary, today is about us. Pop the balloons, then swipe to turn the page.", floaters: "balloons", nameStyle: "display",
          wishes: ["Dear diary: they're still the best thing that ever happened to me.", "Wish found: a weekend away, just us.", "Note to self: hug them longer today.", "Wish found: pizza and a movie, your pick.", "May our story have a million more pages.", "Wish found: a handwritten note in your bag."] },
        { type: "quiz", eyebrow: "Pop quiz", title: "How well do you know us?", lead: "No cheating.", field: "quiz", items: QUIZ_ANNI, win: "{score} out of {total}. You know us by heart", lose: "{score} out of {total}. We need more dates" },
        { type: "gallery", eyebrow: "Pinned memories", title: "Our favourite pages", style: "string" },
        { type: "timeline", eyebrow: "Chapter by chapter", title: "Our story so far", field: "milestones", items: MILESTONES },
        { type: "scratch", eyebrow: "Secret page", title: "Something I wrote just for you", lead: "Scratch the sticker off.", reveal: "{{secret_line}}", cover: "Scratch me" },
        { type: "memory", eyebrow: "Remember when", title: "Match our memories", lead: "Turn two at a time.", pairs: 4, done: "Every memory, found" },
        { type: "letter", eyebrow: "Last page", title: "A postcard for you", lead: "Tap to flip it over.", style: "postcard", field: "letter" },
        { type: "finale", eyebrow: "The end (not really)", title: "To be continued…", lead: "One more tap.", button: "Celebrate us", headline: "Happy Anniversary, {{recipient_name}}", signoff: "Love, {{sender_name}}", effect: "confetti" },
      ],
    },
  },

  /* ───────────── Anniversary 3 · scroll ───────────── */
  {
    ...anni,
    slug: "anni-moonlit-promise",
    name: "Moonlit Promise",
    description: "Midnight blue and silver moonlight. Draw your own constellation, count the days, answer a promise and send lanterns into the night.",
    traits: ["For a partner", "Connect-the-stars", "Days counter", "Sky lanterns"],
    priceMinor: 29900,
    theme: {
      bg: "#0b1026", fg: "#eef1ff", muted: "#a7b0d6", line: "#222a52", card: "#141b3c",
      accent: "#a9c6ff", accent2: "#c3a6ff", accent3: "#ffe29a", onAccent: "#0b1026", paper: "#f4f2ff", paperInk: "#1a1d3d",
      display: "'Bodoni Moda', Georgia, serif", hand: "'Mrs Saint Delafield', cursive", body: "'Manrope', system-ui, sans-serif", letter: "'Bodoni Moda', Georgia, serif",
      fx: ["#a9c6ff", "#c3a6ff", "#ffe29a", "#ffffff"],
      fonts: "family=Bodoni+Moda:ital,wght@0,500;0,700;1,500&family=Mrs+Saint+Delafield&family=Manrope:wght@400;500;700",
    },
    fields: fields("recipient_name", "sender_name", "since_date", "letter"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "moonlit",
      flow: "scroll",
      opener: { kind: "chest", eyebrow: "I caught some moonlight for you", hint: "Tap to open the box", sub: "Sound on, lights low" },
      motif: "moon",
      backdrop: "linear-gradient(180deg, #0b1026 0%, #141b3c 55%, #261f4a 100%)",
      ambient: { orbs: ["#3b4a9a", "#c3a6ff", "#a9c6ff"], particles: "stars", colors: ["#ffffff", "#ffe29a", "#a9c6ff"] },
      chapters: [
        { type: "hero", kicker: "Happy Anniversary", lead: "Under the same moon, still choosing you. Tap the lanterns for wishes.", floaters: "lanterns", nameStyle: "script",
          wishes: ["A wish: every night ends with you.", "May the moon keep all our secrets.", "Wish found: stargazing on the terrace.", "To quiet nights and loud laughter.", "Wish found: a midnight drive, windows down.", "May we always be each other's calm."] },
        { type: "stars", eyebrow: "Our constellation", title: "Connect the stars", lead: "Tap the glowing star, then the next one.", shape: "heart", reveal: "Every star I've ever wished on led me to you" },
        { type: "counter", eyebrow: "Moons together", title: "Since the night it all began", field: "since_date", fallback: "More moons than I can count", done: "Here's to a thousand more moons" },
        { type: "gallery", eyebrow: "Moonlit memories", title: "Little lights of us", style: "polaroid" },
        { type: "question", eyebrow: "A promise", title: "Stay with me for a hundred more moons?", lead: "There's only one answer, and the buttons know it.", yes: "Yes, always", no: ["No", "Hmm", "Try again", "Not an option", "Nope"], done: "Then it's a promise" },
        { type: "ritual", eyebrow: "Make a wish", title: "Send our wishes to the moon", lead: "Tap each lantern to let it fly.", kind: "lanterns", count: 5, done: "The sky is full of us", again: "Light more lanterns" },
        { type: "letter", eyebrow: "For you", title: "A letter by moonlight", lead: "Tap the seal.", style: "envelope", field: "letter" },
        { type: "finale", eyebrow: "Grand finale", title: "Look up", lead: "Ready?", button: "Light up the night", headline: "Happy Anniversary, {{recipient_name}}", signoff: "Yours under every moon, {{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Anniversary 4 · swipe ───────────── */
  {
    ...anni,
    slug: "anni-paris-cafe",
    name: "Paris Café",
    description: "Espresso, terracotta and a love lock on a bridge. Swipe through your story, spin for date nights, fix a photo, grow a bouquet and read a postcard.",
    traits: ["Swipe like a story", "Love lock on a bridge", "Date-night wheel", "Bouquet of reasons"],
    priceMinor: 34900,
    theme: {
      bg: "#2b1a12", fg: "#fbefe1", muted: "#d8c2ad", line: "#4a3226", card: "#38241a",
      accent: "#e07a5f", accent2: "#81b29a", accent3: "#f2cc8f", onAccent: "#2b1a12", paper: "#fdf5e8", paperInk: "#3d2a1e",
      display: "'Abril Fatface', Georgia, serif", hand: "'Allura', cursive", body: "'Josefin Sans', system-ui, sans-serif", letter: "'Libre Baskerville', Georgia, serif",
      fx: ["#e07a5f", "#81b29a", "#f2cc8f", "#fdf5e8", "#d64161"],
      fonts: "family=Abril+Fatface&family=Allura&family=Josefin+Sans:wght@400;600&family=Libre+Baskerville:ital@0;1",
    },
    fields: fields("recipient_name", "sender_name", "letter", "milestones", "reasons", { key: "treats", label: "Date nights on the wheel (one per line)", help: "Up to 8 short ideas, like \"Rooftop dinner\". Leave it empty to use ours." }),
    photos: PHOTOS,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "cafe",
      flow: "swipe",
      opener: { kind: "envelope", eyebrow: "A postcard from Paris", hint: "Tap to open", sub: "Swipe sideways, like flipping through postcards" },
      motif: "rose",
      ambient: { orbs: ["#e07a5f", "#81b29a", "#f2cc8f"], particles: "petals", colors: ["#e07a5f", "#f2cc8f", "#d64161"] },
      chapters: [
        { type: "hero", kicker: "Joyeux anniversaire", lead: "Happy anniversary, mon amour. Pop the hearts, then swipe.", floaters: "hearts", nameStyle: "script",
          wishes: ["Un vœu: croissants in bed, every Sunday.", "Wish found: a trip to Paris, one day.", "May we always be this silly together.", "Wish found: a picnic by the water.", "To long walks and longer talks.", "Wish found: a rose, delivered by {{sender_name}}."] },
        { type: "timeline", eyebrow: "Notre histoire", title: "Our story, in postcards", field: "milestones", items: MILESTONES },
        { type: "ritual", eyebrow: "On the bridge", title: "Lock our love on the bridge", lead: "Tap the lock to close it, and the key goes into the river.", kind: "lovelock", count: 1, done: "Locked forever. The key is gone", again: "Lock it again" },
        { type: "wheel", eyebrow: "Rendez-vous", title: "Spin for our next date", lead: "Three spins. Every date is a promise.", spins: 3, field: "treats", items: DATES, done: "Screenshot it. I'm holding you to these" },
        { type: "slide", eyebrow: "Un petit puzzle", title: "Put us back together", photo: 0, solved: "Parfait", solvedSub: "Solved in {moves} moves. We fit, always." },
        { type: "bouquet", eyebrow: "Pour toi", title: "A bouquet of reasons", lead: "Each flower is one reason I love you.", field: "reasons", items: REASONS, done: "A whole bouquet, just for you" },
        { type: "letter", eyebrow: "La lettre", title: "A postcard, just for you", lead: "Tap to turn it over.", style: "postcard", field: "letter" },
        { type: "finale", eyebrow: "Le grand final", title: "Petals over Paris", lead: "Tap and look up.", button: "Throw the petals", headline: "Happy Anniversary, {{recipient_name}}", signoff: "Je t'aime. {{sender_name}}", effect: "petals" },
      ],
    },
  },

  /* ───────────── Anniversary 5 · scroll ───────────── */
  {
    ...anni,
    slug: "anni-golden-years",
    name: "Golden Years",
    description: "Ivory, emerald and gold, for a long and loving marriage. Count the years, walk their story, renew their promises and raise a toast.",
    traits: ["For parents or grandparents", "Years-together counter", "Renew the vows", "Champagne toast"],
    priceMinor: 39900,
    theme: {
      bg: "#fbf6ea", fg: "#1f3b2d", muted: "#5d6f62", line: "#e6dcc3", card: "#fffdf6",
      accent: "#b8862b", accent2: "#2f6b4f", accent3: "#c0576b", onAccent: "#ffffff", paper: "#fffdf6", paperInk: "#1f3b2d",
      display: "'Cinzel', Georgia, serif", hand: "'Tangerine', cursive", body: "'Mulish', system-ui, sans-serif", letter: "'EB Garamond', Georgia, serif",
      fx: ["#b8862b", "#2f6b4f", "#c0576b", "#e9d8a6", "#f4c7c3"],
      fonts: "family=Cinzel:wght@500;700&family=Tangerine:wght@400;700&family=Mulish:wght@400;600;700&family=EB+Garamond:ital@0;1",
    },
    fields: fields(
      { key: "recipient_name", label: "Who is it for?", placeholder: "Mom & Dad", max: 40 },
      { key: "sender_name", label: "From", placeholder: "Riya & Kabir" },
      { key: "since_date", label: "Their wedding day", required: true },
      "letter", "milestones",
      { key: "promises", label: "Promises they made each other (one per line)" },
    ),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "golden",
      flow: "scroll",
      opener: { kind: "gift", eyebrow: "A gift for two very special people", hint: "Tap to open", sub: "Sound on, please" },
      motif: "rose",
      ambient: { orbs: ["#e9d8a6", "#b8862b", "#2f6b4f"], particles: "sparks", colors: ["#b8862b", "#e9d8a6", "#c0576b"] },
      chapters: [
        { type: "hero", kicker: "Happy Anniversary", lead: "To a love that taught us what love is. Pop the balloons for blessings.", floaters: "balloons", nameStyle: "display",
          wishes: ["A blessing: good health and long walks together.", "May your home always be full of laughter.", "Wish found: a family dinner, everyone home.", "To many more years of chai on the balcony.", "Wish found: a holiday, just the two of you.", "May you keep holding hands, always."] },
        { type: "counter", eyebrow: "Together", title: "Years of love, and counting", lead: "Since the day they said yes.", field: "since_date", fallback: "A lifetime of love", done: "Every one of them a gift to us" },
        { type: "timeline", eyebrow: "Their story", title: "The road you built together", field: "milestones", items: [
          "The wedding | Two families, one very big celebration.",
          "A new home | Small rooms, big dreams.",
          "We arrived | And life got loud, messy and wonderful.",
          "The hard years | You held each other up, and us too.",
          "Today | Still holding hands, still our role models.",
        ] },
        { type: "gallery", eyebrow: "The family album", title: "Portraits of a lifetime", style: "frames" },
        { type: "promises", eyebrow: "Renewing the vows", title: "The promises you keep", lead: "Tap each one to seal it again.", field: "promises", items: PROMISES, done: "Sealed, for another lifetime" },
        { type: "ritual", eyebrow: "A toast", title: "To {{recipient_name}}", lead: "Tap the bottle to pop the champagne.", kind: "champagne", count: 1, done: "Cheers to forever", again: "Pour another" },
        { type: "letter", eyebrow: "From all of us", title: "A letter for you both", lead: "Tap the scroll to unroll it.", style: "scroll", field: "letter" },
        { type: "finale", eyebrow: "Grand finale", title: "A golden celebration", lead: "Ready?", button: "Light up the sky", headline: "Happy Anniversary, {{recipient_name}}", signoff: "With all our love, {{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Proposal 1 · scroll ───────────── */
  {
    ...prop,
    slug: "prop-the-question",
    name: "The Question",
    description: "Red velvet and a ring box. Walk through how you got here, fill the love meter, make your promises, open the box, and ask the question.",
    traits: ["To propose marriage", "Ring box reveal", "Love meter", "They can only say yes"],
    priceMinor: 39900,
    theme: {
      bg: "#2a0610", fg: "#fde8ec", muted: "#e0b4bf", line: "#4a1424", card: "#380b18",
      accent: "#ff4f6d", accent2: "#ffb3c1", accent3: "#f5c86b", onAccent: "#2a0610", paper: "#fff6f2", paperInk: "#3d0f1c",
      display: "'Marcellus', Georgia, serif", hand: "'Alex Brush', cursive", body: "'Poppins', system-ui, sans-serif", letter: "'Cormorant', Georgia, serif",
      fx: ["#ff4f6d", "#f5c86b", "#ffb3c1", "#ffffff"],
      fonts: "family=Marcellus&family=Alex+Brush&family=Poppins:wght@400;500;600&family=Cormorant:ital,wght@0,500;1,500",
    },
    fields: fields("recipient_name", "sender_name", "big_question", "milestones", "reasons", "promises", "letter"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "velvet",
      flow: "scroll",
      opener: { kind: "ringbox", eyebrow: "{{recipient_name}}, I have something for you", hint: "Tap the box", sub: "Sound on. This one matters." },
      motif: "ring",
      ambient: { orbs: ["#ff4f6d", "#7a0f2a", "#f5c86b"], particles: "petals", colors: ["#ff4f6d", "#ffb3c1", "#f5c86b"] },
      chapters: [
        { type: "hero", kicker: "For the one I love", lead: "Before I ask you something, pop the hearts. Each one is a little wish.", floaters: "hearts", nameStyle: "script",
          wishes: ["A wish: every morning starts with you.", "May we never stop holding hands.", "Wish found: a lifetime of inside jokes.", "To growing old and silly together.", "Wish found: a forever, with you in it.", "One more wish is coming. Keep scrolling."] },
        { type: "timeline", eyebrow: "How we got here", title: "Our story, so far", lead: "Every step brought me closer to this moment.", field: "milestones", items: MILESTONES },
        { type: "meter", eyebrow: "Be honest", title: "How much do I love you?", lead: "Press and hold. Keep holding.", levels: METER, done: "Off the charts. Forever." },
        { type: "flips", eyebrow: "Why you", title: "Why it's always been you", lead: "Tap each card.", field: "reasons", items: REASONS },
        { type: "promises", eyebrow: "My promises", title: "What I promise you", lead: "Tap each one to seal it.", field: "promises", items: PROMISES, done: "Sealed. Every single one." },
        { type: "ritual", eyebrow: "One more thing", title: "I've been carrying this for a while", lead: "Tap the box to open it.", kind: "ringbox", count: 1, done: "It's yours, if you'll have me", again: "Close the box" },
        { type: "question", eyebrow: "The question", title: "{{big_question}}", lead: "Take your time. But there's only one right answer.", yes: "Yes!", no: ["No", "Wait, what?", "Think again", "Nice try", "Not an option", "Say yes"], done: "You said yes. I'm the happiest person alive" },
        { type: "finale", eyebrow: "Forever starts now", title: "Let it rain love", lead: "Tap the button.", button: "Celebrate us", headline: "{{recipient_name}} said yes!", signoff: "Forever yours, {{sender_name}}", effect: "hearts" },
      ],
    },
  },

  /* ───────────── Proposal 2 · swipe ───────────── */
  {
    ...prop,
    slug: "prop-written-stars",
    name: "Written in the Stars",
    description: "A violet galaxy you swipe through. Connect the stars into infinity, play the couples quiz and memory game, then answer the question.",
    traits: ["Swipe like a story", "Connect-the-stars", "Couples quiz", "Fireworks finale"],
    priceMinor: 34900,
    theme: {
      bg: "#0d0221", fg: "#f3eaff", muted: "#b9a8d9", line: "#2a1550", card: "#180838",
      accent: "#ff4ecd", accent2: "#6ae3ff", accent3: "#ffe066", onAccent: "#0d0221", paper: "#f7f2ff", paperInk: "#1d0b3d",
      display: "'Unbounded', system-ui, sans-serif", hand: "'Sacramento', cursive", body: "'Sora', system-ui, sans-serif", letter: "'Sora', system-ui, sans-serif",
      fx: ["#ff4ecd", "#6ae3ff", "#ffe066", "#9b5de5", "#ffffff"],
      fonts: "family=Unbounded:wght@500;700&family=Sacramento&family=Sora:wght@400;500;600",
    },
    fields: fields("recipient_name", "sender_name", "big_question", "since_date", "quiz", "letter"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "nebula",
      flow: "swipe",
      opener: { kind: "chest", eyebrow: "A message from the universe", hint: "Tap to open", sub: "Swipe sideways through the stars" },
      motif: "star",
      backdrop: "radial-gradient(120% 80% at 50% 0%, #2a0d5c 0%, #0d0221 60%)",
      ambient: { orbs: ["#9b5de5", "#ff4ecd", "#6ae3ff"], particles: "stars", colors: ["#ffffff", "#ffe066", "#6ae3ff"] },
      chapters: [
        { type: "hero", kicker: "Written in the stars", lead: "The universe has been planning this for a while. Pop the bubbles, then swipe.", floaters: "bubbles", nameStyle: "display",
          wishes: ["Star found: the day we met was no accident.", "A wish: a whole galaxy of days with you.", "Star found: you are my favourite planet.", "May we always orbit each other.", "Star found: something big is coming…", "Keep swiping. The stars have a question."] },
        { type: "stars", eyebrow: "Our sign", title: "Connect the stars", lead: "Tap the glowing star, then follow the path.", shape: "infinity", reveal: "You and me, to infinity" },
        { type: "counter", eyebrow: "Since we met", title: "Our story, in starlight", field: "since_date", fallback: "Since the day the stars lined up", done: "And I want every day after this one too" },
        { type: "quiz", eyebrow: "Cosmic quiz", title: "How well do you know us?", field: "quiz", items: QUIZ_PROP, win: "{score} out of {total}. Written in the stars", lose: "{score} out of {total}. The stars forgive you" },
        { type: "memory", eyebrow: "Star memories", title: "Find the matching memories", lead: "Two at a time.", pairs: 4, done: "Every memory, aligned" },
        { type: "letter", eyebrow: "Transmission", title: "A message for you", lead: "Tap to open.", style: "envelope", field: "letter" },
        { type: "question", eyebrow: "The question", title: "{{big_question}}", lead: "The stars already know the answer.", yes: "Yes!", no: ["No", "Error", "Out of orbit", "Try again", "Impossible"], done: "The universe just celebrated" },
        { type: "finale", eyebrow: "Forever starts now", title: "Light up the galaxy", lead: "Tap and look up.", button: "Light it up", headline: "{{recipient_name}} said yes!", signoff: "To infinity, {{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Proposal 3 · swipe ───────────── */
  {
    ...prop,
    slug: "prop-love-letters",
    name: "Love Letters",
    description: "Soft blush paper and roses, swiped page by page. Grow a bouquet of reasons, flip little notes, scratch a secret, read the letter, then the question.",
    traits: ["Swipe like a story", "Bouquet of reasons", "Scratch-card secret", "Rose-petal finale"],
    priceMinor: 24900,
    theme: {
      bg: "#fff1f3", fg: "#4a1d2c", muted: "#8a5b69", line: "#f4d3da", card: "#ffffff",
      accent: "#e75480", accent2: "#f4a3b7", accent3: "#c9a227", onAccent: "#ffffff", paper: "#fffaf6", paperInk: "#4a1d2c",
      display: "'Young Serif', Georgia, serif", hand: "'Satisfy', cursive", body: "'Quicksand', system-ui, sans-serif", letter: "'Spectral', Georgia, serif",
      fx: ["#e75480", "#f4a3b7", "#c9a227", "#ffd6e0", "#b5838d"],
      fonts: "family=Young+Serif&family=Satisfy&family=Quicksand:wght@400;500;700&family=Spectral:ital@0;1",
    },
    fields: fields("recipient_name", "sender_name", "big_question", "reasons", { key: "secret_line", label: "A secret for the scratch card", default: "I've been planning this for weeks. Swipe once more." }, "letter"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "blush",
      flow: "swipe",
      opener: { kind: "envelope", eyebrow: "A love letter for {{recipient_name}}", hint: "Tap the seal", sub: "Swipe sideways to read every page" },
      motif: "rose",
      ambient: { orbs: ["#f4a3b7", "#ffd6e0", "#e75480"], particles: "petals", colors: ["#e75480", "#f4a3b7", "#ffd6e0"] },
      chapters: [
        { type: "hero", kicker: "To my favourite person", lead: "I wrote you a few pages. Pop the hearts, then swipe.", floaters: "hearts", nameStyle: "script",
          wishes: ["Note: you make my heart do the thing.", "Wish found: roses, every Friday.", "May I always make you smile like this.", "Note: I'd pick you in every lifetime.", "Wish found: a slow dance, anywhere.", "Keep swiping. The best page is last."] },
        { type: "bouquet", eyebrow: "Roses for you", title: "A bouquet of reasons", lead: "Tap to add each flower.", field: "reasons", items: REASONS, done: "All of them are yours" },
        { type: "gallery", eyebrow: "Pressed in my heart", title: "My favourite photos of us", style: "polaroid" },
        { type: "flips", eyebrow: "Little notes", title: "Things I never said out loud", lead: "Tap a note to open it.", items: ["I still get nervous before seeing you.", "I saved every voice note.", "You are my first thought every morning.", "I knew on our third date.", "I practise saying your name with mine.", "I can't imagine a future without you."] },
        { type: "scratch", eyebrow: "A secret", title: "Psst… scratch this", lead: "Gently.", reveal: "{{secret_line}}", cover: "Scratch here" },
        { type: "letter", eyebrow: "My letter", title: "Everything I feel", lead: "Tap to open it.", style: "envelope", field: "letter" },
        { type: "question", eyebrow: "The last page", title: "{{big_question}}", lead: "Only one answer fits on this page.", yes: "Yes!", no: ["No", "Hmm?", "Wrong page", "Try again", "Not allowed"], done: "You just made me the happiest person" },
        { type: "finale", eyebrow: "Our first page", title: "Rose petals for you", lead: "Tap the button.", button: "Throw the petals", headline: "{{recipient_name}} said yes!", signoff: "All my love, {{sender_name}}", effect: "petals" },
      ],
    },
  },

  /* ───────────── Proposal 4 · scroll ───────────── */
  {
    ...prop,
    slug: "prop-neon-nights",
    name: "Neon Nights",
    description: "City lights in hot pink and electric blue. Catch hearts, fill the love meter, spin for dates, play the quiz, then the big question.",
    traits: ["To ask someone out", "Heart catch game", "Date wheel", "Couples quiz"],
    priceMinor: 24900,
    theme: {
      bg: "#07070f", fg: "#f2f4ff", muted: "#9ea3c4", line: "#1d1d36", card: "#10101f",
      accent: "#ff2a6d", accent2: "#05d9e8", accent3: "#f9f871", onAccent: "#07070f", paper: "#f2f4ff", paperInk: "#12122a",
      display: "'Righteous', system-ui, sans-serif", hand: "'Yellowtail', cursive", body: "'Rubik', system-ui, sans-serif", letter: "'Space Mono', monospace",
      fx: ["#ff2a6d", "#05d9e8", "#f9f871", "#d300c5", "#ffffff"],
      fonts: "family=Righteous&family=Yellowtail&family=Rubik:wght@400;500;600&family=Space+Mono",
    },
    fields: fields("recipient_name", "sender_name", { key: "big_question", default: "Will you be mine?" }, "quiz", { key: "treats", label: "Dates on the wheel (one per line)", help: "Up to 8 short ideas, like \"Rooftop dinner\". Leave it empty to use ours." }, "letter"),
    photos: PHOTOS,
    music: { default: "mus_warm_keys" },
    story: {
      skin: "neon",
      flow: "scroll",
      opener: { kind: "gift", eyebrow: "Incoming: something for {{recipient_name}}", hint: "Tap to open", sub: "Sound up, lights down" },
      motif: "heart",
      ambient: { orbs: ["#ff2a6d", "#05d9e8", "#d300c5"], particles: "sparks", colors: ["#ff2a6d", "#05d9e8", "#f9f871"] },
      chapters: [
        { type: "hero", kicker: "Hey you", lead: "I made you something. Pop the balloons, then scroll.", floaters: "balloons", nameStyle: "display",
          wishes: ["Fact: you're the best notification I get.", "Wish found: late-night food runs, together.", "Hot take: you're cute when you laugh at my jokes.", "Wish found: a playlist made just for you.", "Truth: I think about you a lot.", "Keep scrolling. There's a question."] },
        { type: "catch", eyebrow: "Level one", title: "Catch 15 hearts in 20 seconds", lead: "Gold hearts count for three.", item: "heart", target: 15, seconds: 20, win: "You caught my heart", winSub: "Not that it was hard. It was already yours.", lose: "So close!", loseSub: "You caught {caught}. My heart's playing hard to get." },
        { type: "meter", eyebrow: "Level two", title: "How much do I like you?", lead: "Press and hold the button.", levels: ["A little bit", "More than a little", "A lot, honestly", "Way too much", "Off the charts"], done: "Spoiler: off the charts" },
        { type: "wheel", eyebrow: "Level three", title: "Spin for our first dates", lead: "Three spins. All of them are real offers.", spins: 3, field: "treats", items: ["Street food crawl", "Arcade night", "Rooftop dinner", "Long drive", "Concert", "Karaoke", "Movie night", "Ice cream run"], done: "Pick a day. I'm serious." },
        { type: "slide", eyebrow: "Bonus round", title: "Fix the picture", photo: 0, solved: "Perfect match", solvedSub: "{moves} moves. Like us." },
        { type: "quiz", eyebrow: "Final quiz", title: "How well do you know me?", field: "quiz", items: QUIZ_PROP, win: "{score} out of {total}. You get me", lose: "{score} out of {total}. Let's fix that over dinner" },
        { type: "letter", eyebrow: "Real talk", title: "I wrote you something", lead: "Tap to open.", style: "postcard", field: "letter" },
        { type: "question", eyebrow: "Final boss", title: "{{big_question}}", lead: "Choose wisely. Or don't, there's only one option.", yes: "Yes!", no: ["No", "Nope", "Glitch", "Try again", "Not today", "Nice try"], done: "Best answer ever" },
        { type: "finale", eyebrow: "Game won", title: "City lights, just for you", lead: "Tap and look up.", button: "Light it up", headline: "{{recipient_name}} said yes!", signoff: "Yours, {{sender_name}}", effect: "fireworks" },
      ],
    },
  },

  /* ───────────── Proposal 5 · scroll ───────────── */
  {
    ...prop,
    slug: "prop-fairy-garden",
    name: "Fairy-Light Garden",
    description: "A garden at dusk, strung with warm fairy lights. Your story, a bouquet, a ring drawn in fireflies, your promises and lanterns, then the question.",
    traits: ["To propose marriage", "Ring of fireflies", "Bouquet of reasons", "Heart-rain finale"],
    priceMinor: 34900,
    theme: {
      bg: "#14231b", fg: "#fbf3df", muted: "#c3c9b3", line: "#2a3f33", card: "#1c2f25",
      accent: "#ffd27f", accent2: "#e9a6b4", accent3: "#fff3c4", onAccent: "#14231b", paper: "#fffaf0", paperInk: "#24382c",
      display: "'Gilda Display', Georgia, serif", hand: "'Petit Formal Script', cursive", body: "'Figtree', system-ui, sans-serif", letter: "'Lora', Georgia, serif",
      fx: ["#ffd27f", "#e9a6b4", "#fff3c4", "#9ed8a8", "#ffffff"],
      fonts: "family=Gilda+Display&family=Petit+Formal+Script&family=Figtree:wght@400;500;600&family=Lora:ital@0;1",
    },
    fields: fields("recipient_name", "sender_name", "big_question", "milestones", "reasons", "promises", "letter"),
    photos: PHOTOS,
    music: { default: "mus_canon" },
    story: {
      skin: "fairy",
      flow: "scroll",
      opener: { kind: "ringbox", eyebrow: "Meet me in the garden", hint: "Tap the little box", sub: "Sound on, and take your time" },
      motif: "sparkle",
      backdrop: "linear-gradient(180deg, #0f1a26 0%, #14231b 45%, #1c2f25 100%)",
      ambient: { orbs: ["#ffd27f", "#2f5a43", "#e9a6b4"], particles: "fireflies", colors: ["#ffd27f", "#fff3c4", "#e9a6b4"] },
      chapters: [
        { type: "hero", kicker: "For you, my love", lead: "I strung up a few lights for you. Tap the lanterns for wishes.", floaters: "lanterns", nameStyle: "script",
          wishes: ["A wish: a garden of our own, one day.", "May every evening feel like this one.", "Wish found: sunsets, with you, forever.", "To quiet walks and fireflies.", "Wish found: a lifetime of you.", "The garden has a question. Keep scrolling."] },
        { type: "timeline", eyebrow: "Our path", title: "Every step to this garden", field: "milestones", items: MILESTONES },
        { type: "bouquet", eyebrow: "Picked for you", title: "A bouquet of reasons", lead: "Tap to pick each flower.", field: "reasons", items: REASONS, done: "Every flower in the garden is yours" },
        { type: "stars", eyebrow: "Fireflies", title: "Connect the fireflies", lead: "Tap the brightest one, then follow the glow.", shape: "ring", reveal: "Some things are worth asking forever for" },
        { type: "promises", eyebrow: "My promises", title: "What I promise you", lead: "Tap each one to seal it.", field: "promises", items: PROMISES, done: "Sealed with all my heart" },
        { type: "ritual", eyebrow: "Make a wish", title: "Let our wishes float", lead: "Tap each lantern to release it.", kind: "lanterns", count: 5, done: "The whole sky is wishing with us", again: "Light more lanterns" },
        { type: "letter", eyebrow: "For you", title: "Words I've saved for you", lead: "Tap the scroll to unroll it.", style: "scroll", field: "letter" },
        { type: "question", eyebrow: "Under the lights", title: "{{big_question}}", lead: "There's only one answer in this garden.", yes: "Yes!", no: ["No", "Wait", "Think again", "Look at the lights", "Say yes"], done: "You said yes. Forever starts tonight" },
        { type: "finale", eyebrow: "Forever", title: "Let it rain love", lead: "Tap the button.", button: "Celebrate us", headline: "{{recipient_name}} said yes!", signoff: "Forever yours, {{sender_name}}", effect: "hearts" },
      ],
    },
  },
];

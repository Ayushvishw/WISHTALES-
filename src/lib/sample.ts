/** Made-up details used by the public samples and the live banners on the home page. */
export const SAMPLE = {
  recipient_name: "Lisa",
  sender_name: "Andrew",
  relationship: "your best friend since Class 6",
  age: "27",
  message: "I tried to write something clever three times. Here is the plain version.\nYou are the person I call first, with good news, bad news, or nothing at all at 1 a.m.\nYou have never once made me feel like too much. Happy birthday.",
  secret_line: "Same time next year: Goa, finally. The tickets are already booked.",
  letter: "Lisa,\nI tried to write something clever three times. Here is the plain version.\nYou are the person I call first, with good news, bad news, or nothing at all at 1 a.m. You have never once made me feel like too much.\nThank you for every chai, every long walk, every time you laughed at my terrible jokes.\nHere is to another year of you. I am so lucky I get to watch it.",
  reasons: "Your laugh that fills a room\nYou remember everyone's birthday\nYou make the best chai\nYou never give up on people\nYou dance badly and proudly\nYou are kind when no one is watching",
  wishes: "Wish found: breakfast in bed, this Sunday.\nA whole year of your favourite songs.\nWish found: one very long hug from me.\nMay this year be kinder to you than the last.\nWish found: dinner at your favourite place.\nMore laughs, fewer alarms.",
  treats: "A movie night\nBreakfast in bed\nA long drive\nDinner at your favourite place\nA surprise gift\nOne whole lazy day\nA new book\nIce cream at midnight",
};

/** Love-story samples for anniversaries and proposals; anything not listed falls back to SAMPLE. */
const LOVE = {
  since_date: "2021-02-14",
  letter: "Lisa,\nI still remember the exact moment I knew. You were laughing at something silly, and I thought: oh no, this is it.\nEvery day since has been the easiest choice I have ever made. You make the ordinary feel like a holiday.\nThank you for every chai, every long drive, every time you held my hand without asking why.\nWhatever comes next, I want to face it with you.",
  milestones: "Feb 2021 | We met at Priya's party and talked until 2 a.m.\nMarch 2021 | Our first date: chai, rain, and four hours\nDec 2021 | Our first trip to the mountains\n2023 | Our first home, and too many plants\nToday | Still choosing you, every morning",
  promises: "to make you chai every morning\nto laugh at your jokes, even the old ones\nto hold your hand in every storm\nto choose you, every single day\nto always come home to you\nto dance badly with you, forever",
  wishes: "Wish found: a weekend away, just us.\nTo more lazy mornings and late-night talks.\nWish found: a slow dance in the kitchen.\nMay we always find our way back to each other.\nWish found: breakfast in bed, this Sunday.",
  quiz: "Where did we first meet? | At Priya's party | At college | On a train\nWhat was our first date? | Chai in the rain | A movie | Dinner by the sea\nWho said \"I love you\" first? | You did | I did | We said it together",
  secret_notes: "I still get nervous before seeing you.\nI saved every voice note you ever sent.\nI knew on our third date.\nI practise saying your name with mine.",
  reasons: "The way you laugh with your whole face\nYou remember the tiny things\nYou make every day feel like a trip\nYou never let me give up\nYou are my calm\nWith you, home is a person",
};

export const SAMPLE_BY_OCCASION: Record<string, Record<string, string>> = {
  anniversary: { ...LOVE, recipient_name: "Lisa", secret_line: "Pack a bag. We leave for Goa on Friday." },
  proposal: { ...LOVE, recipient_name: "Lisa", secret_line: "There's a ring in my pocket right now." },
};

/** Sample details for an occasion, for samples, banners and the "fill with sample details" button. */
export function sampleFor(occasion: string): Record<string, string> {
  return { ...SAMPLE, ...SAMPLE_BY_OCCASION[occasion] };
}

export const SAMPLE_PHOTOS = Array.from({ length: 8 }, (_, i) => `/samples/${i + 1}.webp`);

export function builtinMusic(id: string) {
  return id === "mus_hbd_box" ? "builtin:hbd" : id === "mus_warm_keys" ? "builtin:chords" : id === "mus_canon" ? "builtin:canon" : null;
}

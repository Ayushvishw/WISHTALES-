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
  treats: "A movie night\nBreakfast in bed\nA long drive\nDinner at your favourite place\nA surprise gift\nOne whole lazy day\nA new book\nIce cream at midnight",
};

/** Love-story samples for anniversaries and proposals; anything not listed falls back to SAMPLE. */
const LOVE = {
  since_date: "2021-02-14",
  letter: "Lisa,\nI still remember the exact moment I knew. You were laughing at something silly, and I thought: oh no, this is it.\nEvery day since has been the easiest choice I have ever made. You make the ordinary feel like a holiday.\nThank you for every chai, every long drive, every time you held my hand without asking why.\nWhatever comes next, I want to face it with you.",
  milestones: "Feb 2021 | We met at Priya's party and talked until 2 a.m.\nMarch 2021 | Our first date: chai, rain, and four hours\nDec 2021 | Our first trip to the mountains\n2023 | Our first home, and too many plants\nToday | Still choosing you, every morning",
  promises: "to make you chai every morning\nto laugh at your jokes, even the old ones\nto hold your hand in every storm\nto choose you, every single day\nto always come home to you\nto dance badly with you, forever",
  reasons: "The way you laugh with your whole face\nYou remember the tiny things\nYou make every day feel like a trip\nYou never let me give up\nYou are my calm\nWith you, home is a person",
};

export const SAMPLE_BY_OCCASION: Record<string, Record<string, string>> = {
  anniversary: { ...LOVE, recipient_name: "Lisa", secret_line: "Pack a bag. We leave for Goa on Friday." },
  proposal: { ...LOVE, recipient_name: "Lisa", secret_line: "There's a ring in my pocket right now." },
};

/** Made-up guest wishes for invitation samples. */
export const SAMPLE_WISHES = [
  { name: "Priya", message: "So happy for you both! Counting the days already." },
  { name: "Rohan", message: "Save me a spot on the dance floor. Congratulations!" },
  { name: "Nani", message: "Blessings and all my love, always." },
];

const WEDDING = {
  couple_one: "Lisa",
  couple_two: "Andrew",
  recipient_name: "our family and friends",
  sender_name: "The Kapoor and Mehta families",
  families: "Daughter of Mrs & Mr Kapoor\nSon of Mrs & Mr Mehta",
  event_time: "7 pm onwards",
  venue_name: "The Lakeside Palace",
  venue_address: "Lake Pichola, Udaipur, Rajasthan",
  events: "Haldi | Friday · 10 am | Poolside lawns\nMehendi | Friday · 4 pm | Garden courtyard\nSangeet | Friday · 8 pm | Durbar Hall\nWedding | Saturday · 7 pm | Lakeside lawns\nReception | Sunday · 8 pm | Grand ballroom",
  letter: "Dear family and friends,\nTwo families, one big celebration. We would be so happy to have you with us as Lisa and Andrew begin their life together.\nCome hungry, come ready to dance, and bring your blessings.",
};

/** Invitations differ by template, so their samples are per template. */
const SAMPLE_BY_TEMPLATE: Record<string, Record<string, string>> = {
  "inv-party-time": { recipient_name: "Lisa", age: "7", sender_name: "Riya and Aarav", event_time: "4 pm to 7 pm", venue_name: "Funky Monkeys Play Café", venue_address: "Indiranagar, Bengaluru", letter: "Lisa is turning 7 and wants all her favourite people there!\nThere will be cake, a magician and far too many balloons. Comfy clothes recommended." },
  "inv-new-home": { recipient_name: "our family and friends", sender_name: "Lisa and Andrew", event_time: "Sunday, 11 am onwards", venue_name: "Flat 702, Lake View Towers", venue_address: "Powai, Mumbai", letter: "After many boxes and a few arguments about paint colours, we're finally home.\nCome bless our new place with us. Lunch is on us." },
  "inv-little-one": { recipient_name: "our family and friends", sender_name: "Lisa and Andrew", couple_one: "Baby shower", event_time: "12 pm onwards", venue_name: "The Garden Room", venue_address: "Koregaon Park, Pune", letter: "Our little one is almost here, and we couldn't think of a better way to welcome them than with all of you.\nCome for the food, stay for the baby games." },
};

/** Sample details for a template, for samples, banners and the "fill with sample details" button. */
export function sampleFor(occasion: string, slug?: string): Record<string, string> {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  if (occasion === "invitations") {
    // A date a few weeks ahead, so the countdown has something to count.
    const soon = ymd(new Date(today.getTime() + 45 * 864e5));
    return { ...SAMPLE, ...WEDDING, ...(slug ? SAMPLE_BY_TEMPLATE[slug] : undefined), event_date: soon };
  }
  return { ...SAMPLE, ...SAMPLE_BY_OCCASION[occasion], event_date: ymd(today) };
}

export const SAMPLE_PHOTOS = Array.from({ length: 8 }, (_, i) => `/samples/${i + 1}.webp`);

export function builtinMusic(id: string) {
  return id === "mus_hbd_box" ? "builtin:hbd" : id === "mus_warm_keys" ? "builtin:chords" : id === "mus_canon" ? "builtin:canon" : null;
}

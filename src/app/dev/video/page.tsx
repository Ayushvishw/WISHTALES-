import { notFound } from "next/navigation";
import { templateConfigSchema } from "@/lib/templates/schema";
import { DevVideo } from "./DevVideo";

export const dynamic = "force-dynamic";

/** Local-only test bench for the video engine. */
export default function DevVideoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const config = templateConfigSchema.parse({
    slug: "vid-dev", version: "0.0.1", occasion: "invitations", name: "Dev video", description: "x", traits: [], priceMinor: 100, currency: "INR",
    layout: "video",
    theme: {
      bg: "#1a0b10", fg: "#fbf1e1", muted: "#e2cdb4", line: "#3a2028", card: "#2a1218",
      accent: "#d9a84e", accent2: "#c2415a", accent3: "#f6d98f", onAccent: "#1a0b10", paper: "#fff8ec", paperInk: "#2a1218",
      display: "'Cormorant Garamond', 'Tiro Devanagari Hindi', Georgia, serif", hand: "'Great Vibes', cursive", body: "'Jost', system-ui, sans-serif", letter: "'Cormorant Garamond', Georgia, serif",
      fx: ["#d9a84e"], fonts: "family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Great+Vibes&family=Jost:wght@400;600&family=Tiro+Devanagari+Hindi",
    },
    fields: [{ key: "recipient_name", label: "x", type: "text" }, { key: "sender_name", label: "x", type: "text" }, { key: "letter", label: "x", type: "textarea" }],
    photos: { min: 0, max: 6 }, music: { default: "mus_canon" },
    video: {
      ornament: "arch", particles: "petals", frame: "arch", sky: ["#2a0f18", "#12060a"], glow: "#7a2a35",
      scenes: [
        { kind: "art", art: "ganesha", eyebrow: "॥ श्री गणेशाय नमः ॥", title: "With his blessings", seconds: 4 },
        { kind: "names", clip: "couple-1", eyebrow: "The wedding of", first: "{{couple_one}}", second: "{{couple_two}}", line: "request the pleasure of your company" },
        { kind: "families", seconds: 4 },
        { kind: "events", each: true, eyebrow: "Join us for the", perEvent: 3.5 },
        { kind: "date" },
        { kind: "gallery", from: 0, caption: "Us", perPhoto: 2 },
        { kind: "venue" },
        { kind: "closing", title: "Warm regards", line: "Looking forward to celebrating with you", signoff: "{{sender_name}}" },
      ],
    },
  });
  const values = {
    couple_one: "Prerna", couple_two: "Sumit", sender_name: "The Rastogi family", recipient_name: "you",
    families: "Daughter of Smt. Nirali & Shri Ramesh Rastogi\nSon of Smt. Sushila & Shri Gajendra Shandilya",
    events: "Haldi | Friday, 1 June · 10 am | Poolside lawns\nSangeet | Friday · 8 pm | Durbar Hall\nWedding | Saturday, 2 June · 7 pm | Lakeside lawns",
    event_date: "2026-12-12", event_time: "7 pm onwards", venue_name: "The Lakeside Palace", venue_address: "Lake Pichola, Udaipur, Rajasthan",
  };
  return <DevVideo experience={{ config, values, photos: ["/samples/1.webp", "/samples/2.webp"], music: { source: "builtin:canon" } }} />;
}

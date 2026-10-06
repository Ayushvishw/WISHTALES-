import { notFound } from "next/navigation";
import { SampleView } from "@/components/SampleView";
import { listTemplates } from "@/lib/orders/service";
import { resolveValues } from "@/lib/personalization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sample" };

const SAMPLE = {
  recipient_name: "Riya",
  sender_name: "Aarav",
  relationship: "your best friend since Class 6",
  age: "27",
  message: "I tried to write something clever three times. Here is the plain version.\nYou are the person I call first, with good news, bad news, or nothing at all at 1 a.m.\nYou have never once made me feel like too much. Happy birthday.",
  secret_line: "Same time next year: Goa, finally. The tickets are already booked.",
  letter: "Riya,\nI tried to write something clever three times. Here is the plain version.\nYou are the person I call first, with good news, bad news, or nothing at all at 1 a.m. You have never once made me feel like too much.\nThank you for every chai, every long walk, every time you laughed at my terrible jokes.\nHere is to another year of you. I am so lucky I get to watch it.",
  reasons: "Your laugh that fills a room\nYou remember everyone's birthday\nYou make the best chai\nYou never give up on people\nYou dance badly and proudly\nYou are kind when no one is watching",
  treats: "A movie night\nBreakfast in bed\nA long drive\nDinner at your favourite place\nA surprise gift\nOne whole lazy day\nA new book\nIce cream at midnight",
};

export default async function SamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = (await listTemplates("birthday")).find((t) => t.slug === slug);
  if (!config) notFound();
  const values = resolveValues(config, { ...SAMPLE, event_date: new Date().toISOString().slice(0, 10) });
  const photos = Array.from({ length: Math.max(config.photos.min, Math.min(config.photos.max, 8)) }, (_, i) => `/samples/${(i % 8) + 1}.webp`);
  const source = config.music.default === "mus_hbd_box" ? "builtin:hbd" : config.music.default === "mus_warm_keys" ? "builtin:chords" : null;
  return <SampleView experience={{ config, values, photos, music: source ? { source } : null }} occasion={config.occasion} />;
}

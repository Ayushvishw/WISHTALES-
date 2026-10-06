import { notFound, redirect } from "next/navigation";
import { inr } from "@/components/Shell";
import { SampleView } from "@/components/SampleView";
import { createDraft, listOccasions, listTemplates } from "@/lib/orders/service";
import { resolveValues } from "@/lib/personalization";
import { builtinMusic, sampleFor } from "@/lib/sample";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sample" };

async function personalize(formData: FormData) {
  "use server";
  const key = await createDraft(String(formData.get("template")));
  redirect(`/d/${key}`);
}

export default async function SamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const live = (await listOccasions()).filter((o) => o.status === "live");
  const all = (await Promise.all(live.map((o) => listTemplates(o.slug)))).flat();
  const config = all.find((t) => t.slug === slug);
  if (!config) notFound();
  const values = resolveValues(config, { ...sampleFor(config.occasion), event_date: new Date().toISOString().slice(0, 10) });
  const photos = Array.from({ length: Math.max(config.photos.min, Math.min(config.photos.max, 8)) }, (_, i) => `/samples/${(i % 8) + 1}.webp`);
  const source = builtinMusic(config.music.default);
  return <SampleView experience={{ config, values, photos, music: source ? { source } : null }} occasion={config.occasion} personalize={personalize} price={inr(config.priceMinor)} />;
}

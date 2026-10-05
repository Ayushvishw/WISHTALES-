import { notFound, redirect } from "next/navigation";
import { DraftEditor } from "@/components/DraftEditor";
import { Shell } from "@/components/Shell";
import { getDraft, listMusic } from "@/lib/orders/service";
import { EDITABLE } from "@/lib/orders/state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personalize", robots: { index: false } };

export default async function DraftPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const d = await getDraft(key);
  if (!d) notFound();
  if (!EDITABLE.includes(d.state)) redirect(d.state === "PAYMENT_PENDING" ? `/d/${key}/checkout` : `/d/${key}/share`);
  const music = await listMusic();
  return (
    <Shell step={1} state={d.state}>
      <DraftEditor draftKey={key} config={d.config} values={d.values} photos={d.photos} musicId={d.musicId} music={music} />
    </Shell>
  );
}

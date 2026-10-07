import type { Metadata } from "next";
import Link from "next/link";
import { SharedPreviewView } from "@/components/SharedPreviewView";
import { getSharedPreview } from "@/lib/orders/service";
import { isToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// A draft someone shared for a second opinion: never indexed, and the title gives nothing away.
export const metadata: Metadata = { title: "A preview, just for you", robots: { index: false, follow: false } };

export default async function SharedPreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = isToken(token) ? await getSharedPreview(token) : { status: "not_found" as const };
  if (r.status === "active") return <SharedPreviewView experience={r.experience} template={r.experience.config.slug} />;
  const copy = {
    sent: ["This one has been sent", "The finished surprise is on its way to the person it was made for, so this preview is closed."],
    editing: ["This preview is being edited", "The person who shared it is still changing a few things. Ask them to send the link again in a bit."],
    not_found: ["We couldn't find this preview", "Check that the link was copied in full. Links are long and easy to cut off."],
  }[r.status];
  return (
    <div className="wrap center-msg">
      <div>
        <h1 style={{ fontSize: 32 }}>{copy[0]}</h1>
        <p className="muted">{copy[1]}</p>
        <Link className="btn ghost" href="/">Visit Wish Tale</Link>
      </div>
    </div>
  );
}

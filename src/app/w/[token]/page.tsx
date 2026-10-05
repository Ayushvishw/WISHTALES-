import type { Metadata } from "next";
import Link from "next/link";
import { RecipientView } from "@/components/RecipientView";
import { getPublicExperience } from "@/lib/orders/service";
import { isToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Personal pages: never indexed, and the title gives nothing away in previews.
export const metadata: Metadata = { title: "A surprise for you", robots: { index: false, follow: false } };

export default async function RecipientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = isToken(token) ? await getPublicExperience(token) : { status: "not_found" as const };
  if (r.status === "active") return <RecipientView experience={r.experience} template={r.experience.config.slug} />;
  const copy = {
    expired: ["This surprise has ended", "The person who sent it chose a time limit, and it has passed. You could ask them to send it again."],
    unavailable: ["This surprise isn't available right now", "It may have been paused. Try again later, or ask the person who sent it."],
    not_found: ["We couldn't find this surprise", "Check that the link was copied in full. Links are long and easy to cut off."],
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

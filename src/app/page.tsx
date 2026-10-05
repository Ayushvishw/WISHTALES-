import Link from "next/link";
import { inr, Shell } from "@/components/Shell";
import { Track } from "@/components/Track";
import { listOccasions, listTemplates } from "@/lib/orders/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const occasions = await listOccasions();
  const birthday = await listTemplates("birthday");
  const from = Math.min(...birthday.map((t) => t.priceMinor));
  return (
    <Shell>
      <Track events={["landing_visit"]} />
      <section className="hero">
        <div>
          <div className="eyebrow">Personalized digital surprises</div>
          <h1>Turn a wish into a little world they can open.</h1>
          <p>Pick a story, add their name, your photos and a song. We turn it into an interactive surprise you share as one link on WhatsApp.</p>
          <div className="row">
            <Link className="btn accent" href="/birthday">Create a birthday surprise</Link>
            {birthday.length > 0 && <span className="note">From {inr(from)} · no app needed to open</span>}
          </div>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="seal">A</div>
          <div className="cap"><small>For Riya</small>Someone has been saving up words for you.</div>
        </div>
      </section>
      <div className="sec-h"><h2>Choose the occasion</h2><span className="note">Birthday is live first</span></div>
      <div className="occ">
        {occasions.filter((o) => o.status !== "hidden").map((o) =>
          o.status === "live" ? (
            <Link key={o.slug} href={`/${o.slug}`} className="live" style={{ display: "flex", flexDirection: "column", gap: 4, textDecoration: "none", background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 14 }}>
              <b style={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: 19 }}>{o.name}</b>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Start here</span>
            </Link>
          ) : (
            <button key={o.slug} disabled><b>{o.name}</b><span>Coming soon</span></button>
          ),
        )}
      </div>
      <ol className="how">
        <li><b>Pick a story</b>Each template is a short interactive experience.</li>
        <li><b>Make it theirs</b>Names, a message, 6 to 8 photos and music.</li>
        <li><b>Preview, then pay</b>See exactly what they will see first.</li>
        <li><b>Share one link</b>Send it on WhatsApp. They open it, no sign-up.</li>
      </ol>
    </Shell>
  );
}

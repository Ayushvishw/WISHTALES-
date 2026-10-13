import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { inr, Shell } from "@/components/Shell";
import { Track } from "@/components/Track";
import { createDraft, listOccasions, listTemplates } from "@/lib/orders/service";
import { FilterGrid } from "@/site/FilterGrid";
import { MagicButton, Reveal, Spotlight } from "@/site/fx";
import { OCCASION_LOOK, Scene } from "@/site/scenes";
import { TemplateCard } from "@/site/TemplateCard";

export const dynamic = "force-dynamic";

/** Who each template suits best, for the filter chips. */
const FOR: Record<string, string[]> = {
  "bday-starlit-love": ["partner"],
  "bday-royal-rose": ["partner"],
  "bday-retro-arcade": ["friends", "family"],
  "bday-ocean-sunset": ["friends", "partner"],
  "bday-garden-bloom": ["family"],
  "bday-galaxy-quest": ["kids", "friends"],
  "bday-desi-dhamaka": ["family", "friends"],
  "bday-candy-land": ["kids"],
  "bday-golden-gala": ["family", "partner"],
  "bday-vintage-scrapbook": ["friends"],
  "anni-forever-always": ["partner"],
  "anni-polaroid-diaries": ["partner"],
  "anni-moonlit-promise": ["partner"],
  "anni-paris-cafe": ["partner"],
  "anni-golden-years": ["parents"],
  "prop-the-question": ["marry"],
  "prop-written-stars": ["marry"],
  "prop-love-letters": ["marry", "date"],
  "prop-neon-nights": ["date"],
  "prop-fairy-garden": ["marry"],
  "inv-shubh-vivah": ["wedding"],
  "inv-ivory-vows": ["wedding"],
  "inv-garden-wedding": ["wedding"],
  "inv-emerald-nights": ["wedding"],
  "inv-ring-ceremony": ["engagement"],
  "inv-party-time": ["party"],
  "inv-new-home": ["home"],
  "inv-little-one": ["baby"],
  "vid-shahi-vivah": ["wedding"],
  "vid-ivory-arch": ["wedding"],
  "vid-midnight-gold": ["wedding"],
  "vid-marigold": ["wedding", "home"],
  "vid-rose-ring": ["engagement"],
  "vid-shubh-vivah-hindi": ["wedding"],
};
const FILTERS = [
  { key: "video", label: "Video to download" },
  { key: "link", label: "Interactive link with RSVP" },
  { key: "partner", label: "For a partner" },
  { key: "friends", label: "For friends" },
  { key: "family", label: "For family" },
  { key: "kids", label: "For kids" },
  { key: "parents", label: "For parents" },
  { key: "marry", label: "Marriage proposal" },
  { key: "date", label: "Ask them out" },
  { key: "wedding", label: "Wedding" },
  { key: "engagement", label: "Engagement" },
  { key: "party", label: "Birthday party" },
  { key: "home", label: "Housewarming" },
  { key: "baby", label: "Baby shower" },
  { key: "swipe", label: "Swipe stories" },
  { key: "scroll", label: "Scroll stories" },
];

async function personalize(formData: FormData) {
  "use server";
  const key = await createDraft(String(formData.get("template")));
  redirect(`/d/${key}`);
}

export default async function OccasionPage({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;
  const occ = (await listOccasions()).find((o) => o.slug === occasion && o.status !== "hidden");
  if (!occ) notFound();
  const look = OCCASION_LOOK[occ.slug] ?? { a: "#ff6b9a", b: "#ffc861", line: "", blurb: "" };
  const banner = { "--oa": look.a, "--ob": look.b } as React.CSSProperties;

  if (occ.status !== "live") {
    return (
      <Shell home>
        <Spotlight className="obanner soon" >
          <div className="obanner-bg" style={banner} aria-hidden="true" />
          <div className="obanner-in">
            <Reveal className="obanner-copy">
              <span className="pill-glow"><i />Coming soon</span>
              <h1 className="h-mega sm">{occ.name}</h1>
              <p className="lead">{look.line} We&apos;re crafting this collection now.</p>
              <div className="cta-row">
                <MagicButton href="/birthday">Explore Birthday templates</MagicButton>
                <Link className="gbtn" href="/#occasions">All occasions</Link>
              </div>
            </Reveal>
            <Reveal delay={150} className="obanner-art" style={banner}><Scene slug={occ.slug} /></Reveal>
          </div>
        </Spotlight>
      </Shell>
    );
  }

  const list = await listTemplates(occasion);
  const flowOf = (t: (typeof list)[number]) => (t.video ? null : t.story?.flow === "swipe" ? "swipe" : "scroll");
  const mixed = new Set(list.map(flowOf).filter(Boolean)).size > 1;
  const formats = new Set(list.map((t) => (t.video ? "video" : "link"))).size > 1;
  // Videos are the quickest to send, so they lead the list.
  if (formats) list.sort((a, b) => Number(!!b.video) - Number(!!a.video));
  return (
    <Shell home>
      <Track events={["occasion_selected", "template_viewed"]} template={occasion} />
      <Spotlight className="obanner">
        <div className="obanner-bg" style={banner} aria-hidden="true" />
        <div className="obanner-in">
          <Reveal className="obanner-copy">
            <span className="pill-glow"><i />{list.length} templates · from {inr(Math.min(...list.map((t) => t.priceMinor)))}</span>
            <h1 className="h-mega sm">{occ.name} <em>{occ.slug === "invitations" ? "people remember" : "surprises"}</em></h1>
            <p className="lead">{formats ? "Send a video your guests can watch anywhere, or an invitation link with RSVP and directions." : look.line} Watch any sample for free, then make it yours.</p>
          </Reveal>
          <Reveal delay={150} className="obanner-art" style={banner}><Scene slug={occ.slug} /></Reveal>
        </div>
      </Spotlight>
      <section className="sec tight">
        <FilterGrid
          filters={FILTERS}
          items={list.map((t, i) => ({
            key: t.slug,
            tags: [...(FOR[t.slug] ?? []), ...(mixed && flowOf(t) ? [flowOf(t)!] : []), ...(formats ? [t.video ? "video" : "link"] : [])],
            node: (
              <Reveal delay={Math.min(i, 5) * 60}>
                <TemplateCard t={t} priority={i < 3}>
                  <form action={personalize} className="tc-actions">
                    <Link className="gbtn sm" href={`/sample/${t.slug}`}>{t.video ? "Watch video" : "Watch sample"}</Link>
                    <input type="hidden" name="template" value={t.slug} />
                    <button className="sbtn sm" type="submit">Personalize</button>
                  </form>
                </TemplateCard>
              </Reveal>
            ),
          }))}
        />
      </section>
    </Shell>
  );
}

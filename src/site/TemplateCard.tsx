import Link from "next/link";
import type { ReactNode } from "react";
import { inr } from "@/components/Shell";
import type { TemplateConfig } from "@/lib/templates/schema";
import { Motif } from "@/story/art";
import { Tilt } from "./fx";
import { hasPoster, Poster } from "./Poster";

const OPENER: Record<string, string> = { gift: "Opens with a gift box", envelope: "Opens with a sealed letter", chest: "Opens with a treasure chest", ringbox: "Opens with a ring box" };

/** A template in the shop: a living mini banner in its own colours, then the details. */
export function TemplateCard({ t, children, priority = false }: { t: TemplateConfig; children?: ReactNode; priority?: boolean }) {
  const th = t.theme;
  const story = t.story;
  const motifs = Array.from({ length: 7 }, (_, i) => i);
  const skin = hasPoster(story?.skin) ? story!.skin! : undefined;
  const hero = story?.chapters.find((c) => c.type === "hero");
  const kicker = hero && hero.type === "hero" ? hero.kicker : "Happy birthday";
  return (
    <Tilt className="tc" style={{ "--ta": th.accent, "--tb": th.accent2 } as React.CSSProperties}>
      {th.fonts && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${th.fonts}&display=swap`} precedence={priority ? "high" : "thumbs"} />}
      <Link href={`/sample/${t.slug}`} className="tc-art" style={{ background: story?.backdrop ?? th.bg, color: th.fg }} aria-label={`Watch the ${t.name} sample`} data-skin={skin}>
        {skin ? <Poster skin={skin} /> : <span className="tc-glow" aria-hidden="true" />}
        {story && !skin && (
          <span className="tc-motifs" aria-hidden="true">
            {motifs.map((i) => (
              <Motif key={i} kind={story.motif} fill={[th.accent, th.accent2, th.accent3 ?? th.accent][i % 3]} size={14 + ((i * 7) % 16)} className={`m m${i}`} />
            ))}
          </span>
        )}
        <span className="tc-kicker" style={{ color: th.accent3 ?? th.accent2 }}>{kicker}</span>
        <span className="tc-name" style={{ fontFamily: th.display }}>Lisa</span>
        <span className="tc-play"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>Watch sample</span>
      </Link>
      <div className="tc-body">
        <div className="tc-top">
          <h3>{t.name}</h3>
          <span className="tc-price">{inr(t.priceMinor)}</span>
        </div>
        <p>{t.description}</p>
        <div className="tc-chips">
          {t.traits.slice(0, 4).map((x) => <span key={x}>{x}</span>)}
        </div>
        <div className="tc-meta">
          {story ? `${story.flow === "swipe" ? "Swipe story" : "Scroll story"} · ${story.chapters.length} chapters · ${OPENER[story.opener.kind]}` : `${t.scenes.length} scenes`}
        </div>
        {children}
      </div>
    </Tilt>
  );
}

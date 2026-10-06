import Link from "next/link";
import { inr, Shell } from "@/components/Shell";
import { Track } from "@/components/Track";
import { listOccasions, listTemplates } from "@/lib/orders/service";
import { resolveValues } from "@/lib/personalization";
import { builtinMusic, SAMPLE_PHOTOS, sampleFor } from "@/lib/sample";
import { CountUp, MagicButton, Reveal, RotatingWord, Spotlight, Tilt } from "@/site/fx";
import { HeroLive, type LiveSlide } from "@/site/HeroLive";
import { OCCASION_LOOK, Scene } from "@/site/scenes";
import { TemplateCard } from "@/site/TemplateCard";

export const dynamic = "force-dynamic";

const HERO_ORDER = ["bday-starlit-love", "prop-the-question", "bday-desi-dhamaka", "anni-paris-cafe", "bday-retro-arcade", "prop-written-stars", "bday-ocean-sunset", "anni-forever-always", "bday-candy-land"];

const FAQ = [
  ["Do they need to download an app?", "No. It opens in the browser on any phone or laptop. They tap your link and the surprise starts."],
  ["How do I send it?", "After you pay you get one private link. Send it on WhatsApp, Instagram, email, or anywhere you chat."],
  ["Can I add our own song?", "Yes. Upload an MP3 or M4A up to 4 MB and it plays from the moment they open the gift. Or pick one of ours."],
  ["Can I see it before I pay?", "Yes. You preview the full surprise with your own names, photos and song first. You only pay when it looks right."],
  ["Who can see it?", "Only people who have the link. Each link is a long random code, and your photos are stored privately."],
  ["Do you have anniversary and proposal surprises?", "Yes. Anniversary and Love & Proposal are live, with days-together counters, a love meter, a ring box and a question they can only say yes to. Weddings and more are on the way."],
  ["What is a swipe story?", "Some templates scroll down like a long page. Swipe stories show one chapter per screen, and they swipe sideways like Instagram stories."],
];

export default async function Home() {
  const occasions = (await listOccasions()).filter((o) => o.status !== "hidden");
  const liveOcc = occasions.filter((o) => o.status === "live");
  const byOcc = Object.fromEntries(await Promise.all(liveOcc.map(async (o) => [o.slug, (await listTemplates(o.slug)).filter((t) => t.layout === "story")] as const)));
  const story = byOcc.birthday ?? [];
  const love = [...(byOcc.proposal ?? []), ...(byOcc.anniversary ?? [])];
  const everything = Object.values(byOcc).flat();
  const from = everything.length ? Math.min(...everything.map((t) => t.priceMinor)) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const slides: LiveSlide[] = HERO_ORDER.map((slug) => everything.find((t) => t.slug === slug))
    .filter((t) => !!t)
    .map((config) => {
      const source = builtinMusic(config.music.default);
      return {
        slug: config.slug,
        name: config.name,
        experience: {
          config,
          values: resolveValues(config, { ...sampleFor(config.occasion), event_date: today }),
          photos: SAMPLE_PHOTOS.slice(0, Math.max(config.photos.min, Math.min(config.photos.max, 8))),
          music: source ? { source } : null,
        },
      };
    });
  const live = occasions.filter((o) => o.status === "live").length;

  return (
    <Shell home>
      <Track events={["landing_visit"]} />

      {/* hero */}
      <Spotlight className="hero2">
        <div className="aurora" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="stars" aria-hidden="true" />
        <div className="floaties" aria-hidden="true">
          <span className="fy f1">🎈</span><span className="fy f2">🎁</span><span className="fy f3">💌</span><span className="fy f4">✨</span><span className="fy f5">🎂</span><span className="fy f6">💖</span>
        </div>
        <div className="hero2-in">
          <div className="hero2-copy">
            <Reveal><span className="pill-glow"><i />{liveOcc.length > 1 ? `${liveOcc.map((o) => o.name).join(", ").replace(/, ([^,]*)$/, " and $1")} are live` : "Birthday collection is live"} · {everything.length} templates</span></Reveal>
            <h1 className="h-mega">
              <Reveal delay={80}>Make their</Reveal>
              <Reveal delay={160}><RotatingWord words={["birthday", "anniversary", "proposal", "wedding day", "Mother's Day"]} /></Reveal>
              <Reveal delay={240}><em>unforgettable.</em></Reveal>
            </h1>
            <Reveal delay={320}>
              <p className="lead">
                Turn your words, photos and their favourite song into a little world they open on their phone: a gift that shakes, games they play, a letter that writes itself, and fireworks at the end.
              </p>
            </Reveal>
            <Reveal delay={400} className="cta-row">
              <MagicButton href="/#occasions">Create a surprise</MagicButton>
              <Link className="gbtn" href={`/sample/${slides[0]?.slug ?? ""}`}>
                <span className="gbtn-play" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg></span>
                Watch a sample
              </Link>
            </Reveal>
            <Reveal delay={480}>
              <ul className="trust">
                <li>No app needed</li>
                <li>One WhatsApp link</li>
                {from > 0 && <li>From {inr(from)}</li>}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={200} className="hero2-live">
            <HeroLive slides={slides} />
            <p className="live-hint">It&apos;s live. Tap the gift.</p>
          </Reveal>
        </div>
        <a href="#occasions" className="scroll-cue" aria-label="Scroll down"><i /></a>
      </Spotlight>

      {/* marquee */}
      <div className="marq" aria-hidden="true">
        {[0, 1].map((row) => (
          <div key={row} className={`marq-row${row ? " rev" : ""}`}>
            {[0, 1].map((k) => (
              <span key={k}>
                {(row ? ["Proposals", "Weddings", "Mother's Day", "Father's Day", "Friendship", "Anniversaries"] : ["Birthdays", "First dates", "Long distance", "Best friends", "Surprises", "Big milestones"]).map((w) => (
                  <b key={w}>{w}<i>✦</i></b>
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* occasions */}
      <section id="occasions" className="sec">
        <Reveal className="sec-head">
          <span className="kick">Every occasion, one place</span>
          <h2 className="h-big">Pick the moment.<br /><em>We&apos;ll make it magic.</em></h2>
        </Reveal>
        <div className="occ2">
          {occasions.map((o, i) => {
            const look = OCCASION_LOOK[o.slug] ?? { a: "#ff6b9a", b: "#ffc861", line: "", blurb: "" };
            const isLive = o.status === "live";
            return (
              <Reveal key={o.slug} delay={i * 70} className={`occ2-cell${i === 0 ? " big" : ""}`}>
                <Tilt className={`occ2-card${isLive ? " live" : ""}`} style={{ "--oa": look.a, "--ob": look.b } as React.CSSProperties}>
                  <Link href={`/${o.slug}`} className="occ2-link">
                    <span className="occ2-bg" aria-hidden="true" />
                    <Scene slug={o.slug} />
                    <span className="occ2-txt">
                      <span className={`occ2-tag${isLive ? " on" : ""}`}>{isLive ? `Live · ${(byOcc[o.slug] ?? []).length} templates` : "Coming soon"}</span>
                      <b>{o.name}</b>
                      <small>{look.line}</small>
                    </span>
                    <span className="occ2-go" aria-hidden="true">→</span>
                  </Link>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* the moment */}
      <section className="moment">
        <div className="moment-glow" aria-hidden="true" />
        {["They open your link.", "A gift starts to shake.", "Their name lights up the screen.", "And for a few minutes,", "the whole world is about them."].map((l, i) => (
          <Reveal key={l} delay={i * 120} className={`moment-line${i === 4 ? " last" : ""}`}>{l}</Reveal>
        ))}
      </section>

      {/* templates rail */}
      <section className="sec">
        <Reveal className="sec-head row-head">
          <div>
            <span className="kick">Birthday collection</span>
            <h2 className="h-big">Ten worlds to choose from.</h2>
          </div>
          <Link href="/birthday" className="gbtn">See all {story.length} →</Link>
        </Reveal>
        <div className="rail">
          {story.map((t, i) => (
            <Reveal key={t.slug} delay={Math.min(i, 4) * 80} className="rail-item">
              <TemplateCard t={t}>
                <div className="tc-actions">
                  <Link className="gbtn sm" href={`/sample/${t.slug}`}>Watch</Link>
                  <Link className="sbtn sm" href="/birthday">Personalize</Link>
                </div>
              </TemplateCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* love rail */}
      {love.length > 0 && (
        <section className="sec">
          <Reveal className="sec-head row-head">
            <div>
              <span className="kick">Anniversary and Love &amp; Proposal</span>
              <h2 className="h-big">For the love stories.</h2>
            </div>
            <Link href={byOcc.proposal?.length ? "/proposal" : "/anniversary"} className="gbtn">See all {love.length} →</Link>
          </Reveal>
          <div className="rail">
            {love.map((t, i) => (
              <Reveal key={t.slug} delay={Math.min(i, 4) * 80} className="rail-item">
                <TemplateCard t={t}>
                  <div className="tc-actions">
                    <Link className="gbtn sm" href={`/sample/${t.slug}`}>Watch</Link>
                    <Link className="sbtn sm" href={`/${t.occasion}`}>Personalize</Link>
                  </div>
                </TemplateCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* what's inside */}
      <section className="sec">
        <Reveal className="sec-head center">
          <span className="kick">What&apos;s inside</span>
          <h2 className="h-big">Not a card. <em>An experience.</em></h2>
        </Reveal>
        <div className="bento">
          <Reveal className="bt bt-song">
            <div className="bt-art eq" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ animationDelay: `${-i * 0.13}s` }} />)}</div>
            <h3>Your song, their soundtrack</h3>
            <p>Upload the song that means something. The colours pulse with the beat.</p>
          </Reveal>
          <Reveal delay={80} className="bt bt-games">
            <div className="bt-art wheel" aria-hidden="true"><span /></div>
            <h3>Games made for them</h3>
            <p>Catch hearts, spin for treats, solve a puzzle of your photo, and try saying No to the big question.</p>
          </Reveal>
          <Reveal delay={160} className="bt bt-photos">
            <div className="bt-art pols" aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} style={{ backgroundImage: `url(/samples/${n}.webp)` }} />)}</div>
            <h3>Your photos, beautifully placed</h3>
            <p>Polaroids, picture frames, film strips. Tap one and it lifts off the wall.</p>
          </Reveal>
          <Reveal delay={140} className="bt bt-share">
            <div className="bt-art chat" aria-hidden="true"><span className="b1">Open this 🎁</span><span className="b2">wishtales.vercel.app/w/…</span><span className="b3">OMG 😭❤️</span></div>
            <h3>One link. That&apos;s it.</h3>
            <p>Share it on WhatsApp. No sign-up, no download, works on every phone.</p>
          </Reveal>
          <Reveal delay={60} className="bt bt-letter">
            <div className="bt-art typer" aria-hidden="true"><span>Dear Lisa, you are my favourite person…</span></div>
            <h3>A letter that writes itself</h3>
            <p>Your words appear one letter at a time, as if you&apos;re writing it in front of them.</p>
          </Reveal>
          <Reveal delay={220} className="bt bt-private">
            <div className="bt-art lock" aria-hidden="true"><span /></div>
            <h3>Private by default</h3>
            <p>Only people with your link can open it. Photos are stored privately.</p>
          </Reveal>
        </div>
      </section>

      {/* numbers */}
      <section className="nums">
        <Reveal className="num"><b><CountUp to={everything.length} /></b><span>templates</span></Reveal>
        <Reveal delay={80} className="num"><b><CountUp to={19} /></b><span>kinds of games and moments</span></Reveal>
        <Reveal delay={160} className="num"><b><CountUp to={occasions.length} /></b><span>occasions, {live} live now</span></Reveal>
        <Reveal delay={240} className="num"><b>0</b><span>apps to install</span></Reveal>
      </section>

      {/* how */}
      <section id="how" className="sec">
        <Reveal className="sec-head center">
          <span className="kick">How it works</span>
          <h2 className="h-big">Ready in ten minutes.</h2>
        </Reveal>
        <ol className="steps2">
          {[
            ["🎨", "Pick a world", "Choose a template. Watch the full sample first."],
            ["✍️", "Make it yours", "Their name, your letter, 4 to 8 photos and a song."],
            ["👀", "Preview everything", "See exactly what they will see before you pay."],
            ["💌", "Send one link", "Share it on WhatsApp and wait for their reaction."],
          ].map(([ic, h, p], i) => (
            <Reveal as="li" key={h} delay={i * 110} className="step2">
              <span className="step2-n">{i + 1}</span>
              <span className="step2-ic" aria-hidden="true">{ic}</span>
              <b>{h}</b>
              <p>{p}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* faq */}
      <section id="faq" className="sec faq">
        <Reveal className="sec-head center">
          <span className="kick">Questions</span>
          <h2 className="h-big">Good to know.</h2>
        </Reveal>
        <div className="faq-list">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 50}>
              <details className="qa">
                <summary>{q}<i aria-hidden="true" /></summary>
                <p>{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* final call */}
      <section className="final">
        <Reveal className="final-card">
          <div className="aurora soft" aria-hidden="true"><i /><i /><i /></div>
          <h2 className="h-big">Someone deserves<br /><em>a little magic</em> today.</h2>
          <p>Pick a birthday, an anniversary or a proposal. It takes ten minutes, and they&apos;ll remember it for years.</p>
          <MagicButton href="/#occasions">Create a surprise</MagicButton>
        </Reveal>
      </section>
    </Shell>
  );
}

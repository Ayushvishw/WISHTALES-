"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PublicExperience } from "@/lib/orders/service";
import type { Scene, Theme } from "@/lib/templates/schema";
import { isPlaying, playAudio, stopAudio } from "./audio";
import { burst, useReducedMotion } from "./hooks";
import { SCENES } from "./scenes";
import { StoryExperience, type Protect } from "@/story/Story";
import "./experience.css";

export type SceneContext = {
  values: Record<string, string>;
  photos: string[];
  theme: Theme;
  reduce: boolean;
  next(): void;
  restart(): void;
  startMusic(): void;
  celebrate(): void;
};

function themeStyle(t: Theme): CSSProperties {
  const dark = (() => {
    const n = parseInt(t.bg.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  })();
  return {
    "--x-bg": t.bg, "--x-fg": t.fg, "--x-muted": t.muted, "--x-line": t.line, "--x-card": t.card,
    "--x-accent": t.accent, "--x-accent2": t.accent2, "--x-on-accent": t.onAccent,
    "--x-paper": t.paper, "--x-paper-ink": t.paperInk,
    "--x-display": t.display, "--x-body": t.body, "--x-letter": t.letter, "--x-hand": t.hand,
    colorScheme: dark ? "dark" : "light",
  } as CSSProperties;
}

/** If one scene fails (for example a missing photo), show a fallback and let the recipient continue. */
class SceneBoundary extends Component<{ onSkip(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.error("Scene failed", e);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <>
        <p className="x-sub">This part couldn&apos;t load.</p>
        <button className="x-btn" onClick={this.props.onSkip}>Continue</button>
      </>
    );
  }
}

type Props = {
  experience: PublicExperience;
  /** Label shown in the corner, e.g. "Preview" for the creator. Never set on the recipient's page. */
  ribbon?: string;
  /** Watermark and held-back chapters for samples and unpaid previews. */
  protect?: Protect;
  onEvent?(name: "experience_completed"): void;
};

/** Renders any template: Template + Personalization + Media + Music → Experience. */
export function Experience(props: Props) {
  // Older stored configs have no layout field; they are scene templates.
  return props.experience.config.layout === "story" ? <StoryExperience {...props} /> : <ScenesExperience {...props} />;
}

function ScenesExperience({ experience, ribbon, onEvent }: Props) {
  const { config, values, photos, music } = experience;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioOk, setAudioOk] = useState(false);
  const fx = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const scene: Scene = config.scenes[index];

  useEffect(() => () => stopAudio(), []);
  useEffect(() => {
    if (scene.type === "closing") onEvent?.("experience_completed");
  }, [scene.type, onEvent]);

  const startMusic = useCallback(() => {
    if (!music) return;
    const ok = playAudio(music.source);
    setAudioOk(ok);
    setPlaying(ok);
  }, [music]);

  const ctx: SceneContext = useMemo(
    () => ({
      values,
      photos,
      theme: config.theme,
      reduce,
      next: () => setIndex((i) => Math.min(i + 1, config.scenes.length - 1)),
      restart: () => setIndex(0),
      startMusic,
      celebrate: () => burst(fx.current, config.theme.fx),
    }),
    [values, photos, config, reduce, startMusic],
  );

  const SceneView = SCENES[scene.type] as (p: { scene: Scene; ctx: SceneContext }) => ReactNode;

  return (
    <div className="xp" style={themeStyle(config.theme)}>
      {ribbon && <div className="xp-ribbon">{ribbon}</div>}
      {audioOk && (
        <button
          className="xp-audio"
          aria-label={playing ? "Pause music" : "Play music"}
          onClick={() => {
            if (isPlaying()) { stopAudio(); setPlaying(false); }
            else startMusic();
          }}
        >
          {playing ? "❚❚" : "♪"}
        </button>
      )}
      <div className="xp-scene" key={scene.id} data-scene={scene.id}>
        <SceneBoundary onSkip={ctx.next}>
          <SceneView scene={scene} ctx={ctx} />
        </SceneBoundary>
      </div>
      <div className="xp-foot" aria-hidden="true">
        {config.scenes.map((s, k) => (
          <i key={s.id} className={k === index ? "on" : k < index ? "done" : ""} />
        ))}
      </div>
      <canvas className="xp-fx" ref={fx} aria-hidden="true" />
    </div>
  );
}

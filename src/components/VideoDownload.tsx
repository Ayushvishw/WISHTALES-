"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { PublicExperience } from "@/lib/orders/service";
import { exportVideo, type ExportResult } from "@/video/export";

type State = { kind: "making"; p: number } | { kind: "ready"; file: File; url: string; ext: ExportResult["ext"] } | { kind: "failed"; msg: string };

/**
 * The paid customer's video: made right here in their browser (in HD, no watermark),
 * then downloaded or handed straight to WhatsApp through the phone's share sheet.
 */
export function VideoDownload({ experience, fileName }: { experience: PublicExperience; fileName: string }) {
  const [state, setState] = useState<State>({ kind: "making", p: 0 });
  const [canShare, setCanShare] = useState(false);
  const [note, setNote] = useState("");
  const run = useRef(0);
  const slug = experience.config.slug;

  const make = () => {
    const id = ++run.current;
    const ctl = new AbortController();
    setState({ kind: "making", p: 0 });
    exportVideo(experience, { signal: ctl.signal, onProgress: (p) => id === run.current && setState({ kind: "making", p }) })
      .then((r) => {
        if (id !== run.current) return;
        const file = new File([r.blob], `${fileName}.${r.ext}`, { type: r.mime });
        setCanShare(!!navigator.canShare?.({ files: [file] }));
        setState({ kind: "ready", file, url: URL.createObjectURL(r.blob), ext: r.ext });
        track("video_rendered", slug);
      })
      .catch((e: Error) => {
        if (id !== run.current || e.name === "AbortError") return;
        console.error(e);
        setState({ kind: "failed", msg: "Your browser couldn't make the video. Please try again, or open this page in Chrome or Safari." });
      });
    return () => ctl.abort();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(make, []);
  useEffect(() => () => { if (state.kind === "ready") URL.revokeObjectURL(state.url); }, [state]);

  const share = async () => {
    if (state.kind !== "ready") return;
    try {
      await navigator.share({ files: [state.file], text: "You're invited!" });
      track("video_shared", slug);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote("Sharing didn't open. Download the video, then attach it in WhatsApp.");
    }
  };

  return (
    <div className="panel vdl">
      {state.kind === "making" && (
        <>
          <h3 style={{ margin: 0 }}>Making your video in HD…</h3>
          <div className="vdl-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.p * 100)}><i style={{ width: `${Math.max(3, state.p * 100)}%` }} /></div>
          <p className="note" style={{ margin: 0 }}>{Math.round(state.p * 100)}% · Keep this page open. It usually takes under a minute.</p>
        </>
      )}
      {state.kind === "ready" && (
        <>
          <video className="vdl-video" src={`${state.url}#t=2.5`} controls playsInline />
          <div className="row">
            {canShare && <button className="btn accent" onClick={share}>Share on WhatsApp</button>}
            <a className={`btn ${canShare ? "ghost" : "accent"}`} href={state.url} download={state.file.name} onClick={() => track("video_downloaded", slug)}>Download video</a>
          </div>
          <p className="note" style={{ margin: 0 }}>
            {state.ext === "mp4" ? "An HD MP4 that plays on every phone. Send it on WhatsApp, or post it to your status or Instagram." : "This browser saved it as WebM. For WhatsApp, open this page in Chrome or Safari to get an MP4."}
          </p>
          {note && <p className="note" role="status" style={{ margin: 0 }}>{note}</p>}
        </>
      )}
      {state.kind === "failed" && (
        <>
          <p className="err" role="alert" style={{ margin: 0 }}>{state.msg}</p>
          <button className="btn accent" onClick={make}>Try again</button>
        </>
      )}
    </div>
  );
}

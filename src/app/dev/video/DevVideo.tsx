"use client";

import { useState } from "react";
import type { PublicExperience } from "@/lib/orders/service";
import { exportVideo } from "@/video/export";
import { VideoExperience } from "@/video/VideoExperience";

export function DevVideo({ experience }: { experience: PublicExperience }) {
  const [msg, setMsg] = useState("");
  const run = async () => {
    const t0 = performance.now();
    const r = await exportVideo(experience, { onProgress: (p) => setMsg(`rendering ${Math.round(p * 100)}%`) });
    (window as unknown as { __wtResult: unknown }).__wtResult = { size: r.blob.size, ext: r.ext, ms: performance.now() - t0, b64: await blobB64(r.blob) };
    setMsg(`done ${r.ext} ${r.blob.size}`);
  };
  return (
    <div style={{ display: "flex", gap: 20, padding: 20, background: "#222", minHeight: "100vh" }}>
      <div style={{ position: "relative", width: 360, height: 640 }}><VideoExperience experience={experience} /></div>
      <div style={{ color: "#fff" }}><button id="export" onClick={run}>Export</button><p id="msg">{msg}</p></div>
    </div>
  );
}

async function blobB64(b: Blob) {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

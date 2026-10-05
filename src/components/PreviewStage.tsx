"use client";

import { useEffect, useState } from "react";
import { Experience } from "@/experience/Experience";
import { track } from "@/lib/analytics";
import type { PublicExperience } from "@/lib/orders/service";

export function PreviewStage({ experience, template }: { experience: PublicExperience; template: string }) {
  const [run, setRun] = useState(0);
  useEffect(() => track("preview_generated", template), [template]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <div className="phone">
        <div className="screen" style={{ position: "relative" }}>
          <Experience key={run} experience={experience} ribbon="Preview · full simulation" />
        </div>
      </div>
      <button className="btn ghost small" onClick={() => setRun((r) => r + 1)}>Restart preview</button>
    </div>
  );
}

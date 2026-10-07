"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Experience } from "@/experience/Experience";
import { track } from "@/lib/analytics";
import type { PublicExperience } from "@/lib/orders/service";

/** A draft shared for a second opinion: the full story, watermarked, view-only. */
export function SharedPreviewView({ experience, template }: { experience: PublicExperience; template: string }) {
  useEffect(() => track("shared_preview_opened", template), [template]);
  return (
    <div className="x-page">
      <div className="screen">
        <Experience experience={experience} ribbon="Preview · not sent yet" protect={{ watermark: "PREVIEW · WISHTALES" }} />
      </div>
      <Link href="/" className="shared-note">Someone is making this on Wish Tale and wanted your opinion first</Link>
    </div>
  );
}

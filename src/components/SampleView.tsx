"use client";

import Link from "next/link";
import { Experience } from "@/experience/Experience";
import type { PublicExperience } from "@/lib/orders/service";

export function SampleView({ experience, occasion }: { experience: PublicExperience; occasion: string }) {
  return (
    <div className="x-page">
      <div className="screen">
        <Experience experience={experience} ribbon="Sample" />
      </div>
      <Link href={`/${occasion}`} style={{ position: "absolute", right: 10, top: "calc(env(safe-area-inset-top,0px) + 10px)", zIndex: 30, background: "rgba(0,0,0,.55)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>
        Close sample
      </Link>
    </div>
  );
}

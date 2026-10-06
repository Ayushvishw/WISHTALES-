"use client";

import Link from "next/link";
import { Experience } from "@/experience/Experience";
import type { PublicExperience } from "@/lib/orders/service";

/** A free sample: watermarked, with the letter and finale held back until the customer makes their own. */
export function SampleView({ experience, occasion, personalize, price }: { experience: PublicExperience; occasion: string; personalize(formData: FormData): Promise<void>; price: string }) {
  const locked = (
    <form action={personalize} className="st-lock-cta">
      <input type="hidden" name="template" value={experience.config.slug} />
      <button className="st-btn accent" type="submit">Make it yours · {price}</button>
      <small>Add your details and preview it free before you pay.</small>
    </form>
  );
  return (
    <div className="x-page">
      <div className="screen">
        <Experience experience={experience} ribbon="Sample" protect={{ watermark: "SAMPLE · WISHTALES", locked }} />
      </div>
      <Link href={`/${occasion}`} style={{ position: "absolute", right: 10, top: "calc(env(safe-area-inset-top,0px) + 10px)", zIndex: 30, background: "rgba(0,0,0,.55)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>
        Close sample
      </Link>
    </div>
  );
}

"use client";

import { useCallback, useEffect } from "react";
import { Experience } from "@/experience/Experience";
import { track } from "@/lib/analytics";
import type { PublicExperience } from "@/lib/orders/service";

export function RecipientView({ experience, template }: { experience: PublicExperience; template: string }) {
  useEffect(() => track("experience_opened", template), [template]);
  const onEvent = useCallback(() => track("experience_completed", template), [template]);
  return (
    <div className="x-page">
      <div className="screen">
        <Experience experience={experience} onEvent={onEvent} />
      </div>
    </div>
  );
}

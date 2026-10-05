"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires analytics events once when a page mounts. */
export function Track({ events, template }: { events: AnalyticsEvent[]; template?: string }) {
  useEffect(() => {
    events.forEach((e) => track(e, template));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

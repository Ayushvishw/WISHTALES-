export const ANALYTICS_EVENTS = [
  "landing_visit",
  "occasion_selected",
  "template_viewed",
  "template_selected",
  "form_started",
  "preview_generated",
  "checkout_started",
  "payment_success",
  "payment_failure",
  "experience_activated",
  "share_link_copied",
  "share_whatsapp",
  "experience_opened",
  "experience_completed",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Browser-side tracker. Fire-and-forget; analytics must never break the page. */
export function track(name: AnalyticsEvent, template?: string) {
  if (typeof window === "undefined") return;
  try {
    let visit = sessionStorage.getItem("wt_visit");
    if (!visit) {
      visit = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");
      sessionStorage.setItem("wt_visit", visit);
    }
    const body = JSON.stringify({ name, template, visit });
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    /* ignore */
  }
}

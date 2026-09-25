import type { DashboardAlertItem } from "@/domain/dashboard/alerts";

/* Hallmark · component: card · genre: modern-minimal · theme: Perks
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 * Hallmark · pre-emit critique: P4 H5 E5 S4 R5 V4
 */

export type AlertToneSurface = {
  paper: string;
  paperInset: string;
  title: string;
  body: string;
  priority: string;
};

export function alertToneSurface(
  tone: DashboardAlertItem["tone"],
): AlertToneSurface {
  if (tone === "danger") {
    return {
      paper: "bg-signal-danger-paper",
      paperInset: "bg-signal-danger-paper-2",
      title: "text-signal-danger-ink",
      body: "text-signal-danger-muted",
      priority: "text-signal-danger-ink",
    };
  }

  if (tone === "warning") {
    return {
      paper: "bg-signal-warning-paper",
      paperInset: "bg-signal-warning-paper-2",
      title: "text-signal-warning-ink",
      body: "text-signal-warning-muted",
      priority: "text-signal-warning-ink",
    };
  }

  return {
    paper: "bg-signal-ok-paper",
    paperInset: "bg-signal-ok-paper-2",
    title: "text-signal-ok-ink",
    body: "text-signal-ok-muted",
    priority: "text-signal-ok-ink",
  };
}

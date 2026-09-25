"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { alertToneSurface } from "@/components/dashboard/alert-tone-surface";
import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardFollowUpMetrics } from "@/domain/dashboard/schemas";

const ALERT_PREVIEW_LIMIT = 2;

type DashboardAlertsSummaryPreviewProps = {
  alerts: DashboardAlertItem[];
  metrics: DashboardFollowUpMetrics;
};

export function DashboardAlertsSummaryPreview({
  alerts,
  metrics,
}: DashboardAlertsSummaryPreviewProps) {
  const previewAlerts = alerts.slice(0, ALERT_PREVIEW_LIMIT);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/65">
            Seguimiento
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">Alertas</h3>
        </div>
        <Link
          href="/dashboard#alertas"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 text-xs font-semibold text-white transition hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ver todas
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {(metrics.openCount > 0 || metrics.escalatedCount > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {metrics.openCount > 0 ? (
            <span className="text-[11px] font-semibold text-white/90">
              {metrics.openCount}{" "}
              {metrics.openCount === 1 ? "abierto" : "abiertos"}
            </span>
          ) : null}
          {metrics.escalatedCount > 0 ? (
            <span className="text-[11px] font-semibold text-rose-200">
              {metrics.escalatedCount} escalado
              {metrics.escalatedCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {previewAlerts.length > 0 ? (
          <ul className="flex flex-1 flex-col justify-evenly gap-2">
            {previewAlerts.map((alert) => {
              const surface = alertToneSurface(alert.tone);

              return (
                <li
                  key={alert.id}
                  className={`min-w-0 rounded-xl px-3 py-2.5 ${surface.paper}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`min-w-0 line-clamp-2 wrap-anywhere text-sm font-semibold leading-5 ${surface.title}`}
                    >
                      {alert.title}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] font-semibold ${surface.priority}`}
                    >
                      {alert.priority}
                    </span>
                  </div>
                  <p
                    className={`mt-1 line-clamp-2 text-xs leading-4 ${surface.body}`}
                  >
                    {alert.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex flex-1 items-center text-sm leading-5 text-white/75">
            Sin alertas abiertas. Revisa las sucursales con barras en rojo o
            amarillo más abajo.
          </p>
        )}
      </div>

      {alerts.length > ALERT_PREVIEW_LIMIT ? (
        <p className="mt-2 text-[11px] leading-4 text-white/60">
          +{alerts.length - ALERT_PREVIEW_LIMIT} más en Alertas
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardFollowUpMetrics } from "@/domain/dashboard/schemas";

const ALERT_PREVIEW_LIMIT = 2;

function alertToneClasses(tone: DashboardAlertItem["tone"]) {
  if (tone === "danger") {
    return {
      chip: "text-red-700",
    };
  }

  if (tone === "warning") {
    return {
      chip: "text-amber-700",
    };
  }

  return {
    chip: "text-emerald-700",
  };
}

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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Seguimiento
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Alertas</h3>
        </div>
        <Link
          href="/dashboard#alertas"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          Ver todas
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {(metrics.openCount > 0 || metrics.escalatedCount > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metrics.openCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {metrics.openCount}{" "}
              {metrics.openCount === 1 ? "abierto" : "abiertos"}
            </span>
          ) : null}
          {metrics.escalatedCount > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
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
              const classes = alertToneClasses(alert.tone);

              return (
                <li
                  key={alert.id}
                  className="rounded-xl bg-white px-3 py-2.5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                      {alert.title}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] font-semibold ${classes.chip}`}
                    >
                      {alert.priority}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-600">
                    {alert.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="flex flex-1 items-center text-sm leading-5 text-slate-500">
            Sin alertas abiertas. Revisa las sucursales con barras en rojo o
            amarillo más abajo.
          </p>
        )}
      </div>

      {alerts.length > ALERT_PREVIEW_LIMIT ? (
        <p className="mt-2 text-[11px] leading-4 text-slate-400">
          +{alerts.length - ALERT_PREVIEW_LIMIT} más en Alertas
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { Activity, AlertCircle, ChevronUp, Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardInsight } from "@/domain/dashboard/schemas";

type DashboardAiAssistantProps = {
  insight?: DashboardInsight | null;
  alerts: DashboardAlertItem[];
};

function getToneClass(tone: DashboardAlertItem["tone"]) {
  if (tone === "danger") return "border-red-200 bg-white text-red-800";
  if (tone === "warning") return "border-amber-200 bg-white text-amber-800";
  return "border-slate-200 bg-white text-slate-800";
}

export function DashboardAiAssistant({
  insight,
  alerts,
}: DashboardAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeAlert = alerts[activeIndex % Math.max(alerts.length, 1)];
  const unreadCount = alerts.filter((alert) => alert.unread).length;

  useEffect(() => {
    if (alerts.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % alerts.length);
    }, 12_000);

    return () => window.clearInterval(timer);
  }, [alerts.length]);

  return (
    <aside className="fixed bottom-5 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm sm:right-6">
      {isOpen ? (
        <section
          aria-label="Asistente IA de alertas"
          className="overflow-hidden rounded-xl bg-white shadow-[0_18px_60px_rgba(15,23,42,0.2)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 text-slate-950">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">Monitor operativo</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Avisos periódicos sobre alertas y señales del sitio.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Cerrar asistente IA"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-lg bg-white p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Lectura IA
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-slate-950">
                {insight?.headline ?? "Sin señales suficientes todavía"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {insight?.detail ??
                  "Cuando entren comentarios y alertas, el agente resumirá qué requiere atención."}
              </p>
              {insight?.action ? (
                <p className="mt-2 border-t border-slate-100 pt-2 text-sm font-semibold text-slate-900">
                  Acción sugerida: {insight.action}
                </p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">
                  Alertas activas
                </p>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {alerts.length}
                </span>
              </div>

              {activeAlert ? (
                <article
                  className={`mt-3 rounded-lg p-3 ${getToneClass(activeAlert.tone)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md border-current/20 bg-white px-2.5 py-1 text-xs font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {activeAlert.priority}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {activeAlert.subtitle}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold leading-5">
                    {activeAlert.title}
                  </h4>
                  <p className="mt-1 text-sm leading-5 opacity-80">
                    {activeAlert.detail}
                  </p>
                </article>
              ) : (
                <div className="mt-3 rounded-lg border-dashed bg-white p-3 text-sm leading-6 text-slate-500">
                  No hay alertas abiertas en este momento.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ml-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-[0_14px_44px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_54px_rgba(15,23,42,0.2)]"
          aria-label="Abrir asistente IA de alertas"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex size-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Activity className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Monitor operativo
              </span>
              <span className="block truncate text-xs text-slate-500">
                {activeAlert?.title ?? "Sin alertas activas"}
              </span>
            </span>
          </span>
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      )}
    </aside>
  );
}

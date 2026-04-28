import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  MapPinned,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  dashboardMockAiInsight,
  dashboardMockAiSignals,
} from "./dashboard.mock-data";

type DashboardExecutiveSummaryProps = {
  showDemoData: boolean;
};

const signalIcons: LucideIcon[] = [MapPinned, Clock3, TrendingUp];

const emptyAiSignals = [
  {
    label: "Prioridad",
    value: "Sin datos",
    detail: "Aún no hay señales registradas",
  },
  {
    label: "Patrón dominante",
    value: "Sin datos",
    detail: "Aparecerá cuando existan comentarios",
  },
  {
    label: "Señal positiva",
    value: "Sin datos",
    detail: "Pendiente de actividad",
  },
];

export function DashboardExecutiveSummary({
  showDemoData,
}: DashboardExecutiveSummaryProps) {
  const insight = showDemoData
    ? dashboardMockAiInsight
    : {
        status: "Insights IA sin datos",
        confidence: "Esperando información",
        headline: "Todavía no hay señales suficientes para analizar.",
        detail:
          "Cuando entren comentarios, CSAT y estados de seguimiento, este bloque mostrará prioridades claras para la gerencia.",
        action: "Esperando actividad",
      };
  const signals = showDemoData ? dashboardMockAiSignals : emptyAiSignals;

  return (
    <section
      aria-label="Insights IA"
      className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-sm"
    >
      <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="border-b border-slate-100 p-5 xl:border-b-0 xl:border-r">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white">
                  <BrainCircuit size={14} aria-hidden="true" />
                  {insight.status}
                </p>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <Sparkles size={14} aria-hidden="true" />
                  {insight.confidence}
                </p>
              </div>

              <h3 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-normal text-slate-950">
                {insight.headline}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {insight.detail}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] bg-[#f7f8f4] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Acción sugerida
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-900">
              {insight.action}
              <ArrowRight size={16} aria-hidden="true" />
            </p>
          </div>
        </article>

        <div className="grid gap-0 divide-y divide-slate-100">
          {signals.map((signal, index) => {
            const Icon = signalIcons[index] ?? Sparkles;

            return (
              <article
                key={signal.label}
                className="flex items-center gap-4 p-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-950">
                    {signal.value}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {signal.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

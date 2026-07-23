"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleAlert,
  Ear,
  Info,
  LineChart,
  MessageSquareText,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardNotification } from "@/domain/dashboard/schemas";
import {
  getListeningAverageSummary,
  getListeningDailySummary,
  getListeningModeSummary,
} from "@/domain/listening/daily-summary";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import type { ListeningSettings } from "@/domain/listening/settings";
import {
  listeningLevelDescriptions,
  listeningLevelLabels,
} from "@/domain/listening/schemas";
import { DashboardFloatingNav } from "../dashboard-floating-nav";
import type { DashboardCurrentUser } from "../dashboard-user-menu";
import { PlatformFooter } from "@/components/platform-footer";
import { ListeningBranchFilter } from "./listening-branch-filter";
import { ListeningReminderSettingsPanel } from "./listening-reminder-settings-panel";
import { buildListeningSectionHref } from "./listening-section-tabs";

type ListeningAnalyticsViewProps = {
  listeningEvents: ListeningEventRow[];
  currentUser?: DashboardCurrentUser;
  listeningSettings: ListeningSettings;
  canManageListening?: boolean;
  canViewNotifications?: boolean;
  notifications?: DashboardNotification[];
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchIds: string[];
  lockedBranchScope?: boolean;
};

const levelMeta: Record<
  ListeningEventRow["level"],
  { label: string; color: string; bg: string; description: string }
> = {
  download: {
    label: listeningLevelLabels.download,
    color: "#64748b",
    bg: "bg-slate-100 text-slate-700",
    description: listeningLevelDescriptions.download,
  },
  debate: {
    label: listeningLevelLabels.debate,
    color: "#14b8a6",
    bg: "bg-teal-50 text-teal-800",
    description: listeningLevelDescriptions.debate,
  },
  empathetic_listening: {
    label: listeningLevelLabels.empathetic_listening,
    color: "#0f766e",
    bg: "bg-emerald-50 text-emerald-800",
    description: listeningLevelDescriptions.empathetic_listening,
  },
  generative_dialogue: {
    label: listeningLevelLabels.generative_dialogue,
    color: "#0f2f5f",
    bg: "bg-blue-50 text-blue-900",
    description: listeningLevelDescriptions.generative_dialogue,
  },
};

const levelOrder: ListeningEventRow["level"][] = [
  "download",
  "debate",
  "empathetic_listening",
  "generative_dialogue",
];

function getLevelCounts(events: ListeningEventRow[]) {
  return levelOrder.map((level) => ({
    level,
    count: events.filter((event) => event.level === level).length,
  }));
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    value?: number;
  }>;
  label?: string;
};

const chartSeries = [
  { key: "download", label: listeningLevelLabels.download, color: "#64748b" },
  { key: "debate", label: listeningLevelLabels.debate, color: "#14b8a6" },
  {
    key: "empatheticListening",
    label: listeningLevelLabels.empathetic_listening,
    color: "#0f766e",
  },
  {
    key: "generativeDialogue",
    label: listeningLevelLabels.generative_dialogue,
    color: "#0f2f5f",
  },
] as const;

function ListeningChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const visiblePayload = payload.filter((item) => Number(item.value) > 0);
  const total = payload.reduce((sum, item) => sum + Number(item.value ?? 0), 0);

  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">
        {total} registro{total === 1 ? "" : "s"}
      </p>
      <div className="mt-2 space-y-1">
        {visiblePayload.length > 0 ? (
          visiblePayload.map((item) => {
            const series = chartSeries.find((entry) => entry.key === item.dataKey);
            return (
              <div
                key={item.dataKey}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {series?.label ?? item.dataKey}
                </span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-500">Sin registros ese dia.</p>
        )}
      </div>
    </div>
  );
}

function formatListeningDate(value: string) {
  return new Date(value).toLocaleString("es-HN").replace(/\u00a0/g, " ");
}

export function ListeningAnalyticsView({
  listeningEvents,
  currentUser,
  listeningSettings,
  canManageListening = false,
  canViewNotifications = false,
  notifications = [],
  dateRange,
  branches,
  selectedBranchIds,
  lockedBranchScope = false,
}: ListeningAnalyticsViewProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const levelCounts = getLevelCounts(listeningEvents);
  const dailySummary = getListeningDailySummary(listeningEvents, dateRange);
  const averageSummary = getListeningAverageSummary(listeningEvents);
  const modeSummary = getListeningModeSummary(listeningEvents);
  const totalEvents = listeningEvents.length;
  const lowLevelEvents = listeningEvents.filter(
    (event) => event.level === "download" || event.level === "debate",
  ).length;
  const highLevelEvents = totalEvents - lowLevelEvents;
  const highLevelRatio = totalEvents
    ? Math.round((highLevelEvents / totalEvents) * 100)
    : 0;
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <DashboardFloatingNav
        activeView="escucha"
        onViewChange={() => {}}
        currentUser={currentUser}
        canViewNotifications={canViewNotifications}
        notifications={canViewNotifications ? notifications : []}
        listeningSubNav={{
          activeTab: "analytics",
          analyticsHref: buildListeningSectionHref(
            "/dashboard/escucha",
            dateRange,
            selectedBranchIds,
          ),
          coachingHref: buildListeningSectionHref(
            "/dashboard/escucha/coaching",
            dateRange,
            selectedBranchIds,
          ),
        }}
      />

      <section className="mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 pb-4 pt-28 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">
              Analítica de escucha
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Observa cómo evoluciona la práctica de escucha del equipo por
              nivel y registros recientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardDateFilter
              dateRange={dateRange}
              basePath="/dashboard/escucha"
              selectedBranchIds={selectedBranchIds}
            />
            <ListeningBranchFilter
              dateRange={dateRange}
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              lockedBranchScope={lockedBranchScope}
              basePath="/dashboard/escucha"
            />
            {canManageListening ? (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Configurar
              </button>
            ) : null}
            <Link
              href="/escucha"
              aria-label="Abrir evaluación"
              title="Abrir evaluación"
              className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-800 text-white shadow-emerald-900/20 transition hover:bg-emerald-900"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Evaluaciones",
              value: totalEvents.toString(),
              detail: "Registros de escucha",
              icon: Ear,
            },
            {
              label: "Escucha alta",
              value: `${highLevelRatio}%`,
              detail: "Empática o generativa",
              icon: LineChart,
            },
            {
              label: "Media del periodo",
              value: averageSummary.averageLabel,
              detail:
                averageSummary.average === null
                  ? "Nivel promedio"
                  : `Cercano a ${averageSummary.nearestLevelLabel}`,
              icon: BarChart3,
            },
            {
              label: "Moda del periodo",
              value: modeSummary.modeLabel,
              detail: modeSummary.detail,
              icon: MessageSquareText,
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{metric.detail}</p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-6 rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Comportamiento diario
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Evolución diaria de los niveles registrados en el periodo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {dateRange.label}
              </span>
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                Información
              </button>
            </div>
          </div>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailySummary}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip content={<ListeningChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                {chartSeries.map((series) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    stackId="listening"
                    fill={series.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chartSeries.map((series) => (
              <span
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Distribución por nivel
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Lectura operativa de cómo se está escuchando en el equipo.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {dateRange.label}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              {levelCounts.map(({ level, count }) => {
                const meta = levelMeta[level];
                const width = totalEvents ? Math.max((count / totalEvents) * 100, 4) : 4;
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{meta.label}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {meta.description}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.bg}`}>
                        {count}
                      </span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Registros recientes
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Últimas señales reportadas por colaboradores.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Escucha interna
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {listeningEvents.length > 0 ? (
                listeningEvents.slice(0, 8).map((event) => {
                  const meta = levelMeta[event.level];
                  return (
                    <article
                      key={event.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg}`}>
                            {meta.label}
                          </span>
                          <p className="text-sm font-semibold text-slate-950">
                            {event.userName}
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {event.note || "Sin nota registrada."}
                        </p>
                      </div>
                      <div className="text-xs font-medium text-slate-400 sm:text-right">
                        {formatListeningDate(event.createdAt)}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="py-10 text-center">
                  <CircleAlert className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Todavía no hay evaluaciones de escucha
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Comparte la vista de evaluación con los colaboradores para empezar a ver tendencias.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

      </section>

      {isSettingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Cerrar configuración"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="listening-settings-title"
            className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[1.35rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
          >
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Cerrar</span>
            </button>
            <ListeningReminderSettingsPanel
              initialSettings={listeningSettings}
              canManage={canManageListening}
              titleId="listening-settings-title"
            />
          </div>
        </div>
      ) : null}

      {isInfoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Cerrar información"
            onClick={() => setIsInfoOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="listening-info-title"
            className="relative w-full max-w-2xl rounded-[1.35rem] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
          >
            <button
              type="button"
              onClick={() => setIsInfoOpen(false)}
              className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Cerrar</span>
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Información
            </p>
            <h2
              id="listening-info-title"
              className="mt-2 pr-12 text-xl font-semibold text-slate-950"
            >
              Cómo leer la analítica de escucha
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Esta vista resume cómo se sintió el nivel de escucha del equipo
              dentro del periodo seleccionado.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Rango seleccionado
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Define qué registros entran en el análisis. Si eliges un
                  rango personalizado, todas las tarjetas y la gráfica usan solo
                  esas fechas.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Comportamiento diario
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Cada barra representa un día. Los colores muestran cuántas
                  respuestas hubo en Descarga, Debate, Escucha empática o
                  Diálogo generativo.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Media del periodo
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Es el promedio general del periodo. Sirve para ver si el
                  equipo, en conjunto, se acerca más a escucha inicial o a
                  escucha más profunda.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Moda del periodo
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Es el nivel que más se repitió. Ayuda a identificar cuál fue
                  el comportamiento más común del equipo.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <PlatformFooter />
    </main>
  );
}

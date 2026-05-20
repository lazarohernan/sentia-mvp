"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleAlert,
  Ear,
  LineChart,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";

import type { ListeningEventRow } from "@/domain/listening/schemas";
import { DashboardFloatingNav } from "../dashboard-floating-nav";

type ListeningAnalyticsViewProps = {
  listeningEvents: ListeningEventRow[];
};

const levelMeta: Record<
  ListeningEventRow["level"],
  { label: string; color: string; bg: string; description: string }
> = {
  download: {
    label: "Descarga",
    color: "#64748b",
    bg: "bg-slate-100 text-slate-700",
    description: "Respuestas automáticas o hábitos.",
  },
  debate: {
    label: "Factual",
    color: "#14b8a6",
    bg: "bg-teal-50 text-teal-800",
    description: "Datos nuevos o algo distinto.",
  },
  empathetic_listening: {
    label: "Escucha empática",
    color: "#0f766e",
    bg: "bg-emerald-50 text-emerald-800",
    description: "Comprensión de emoción y contexto.",
  },
  generative_dialogue: {
    label: "Diálogo generativo",
    color: "#0f2f5f",
    bg: "bg-blue-50 text-blue-900",
    description: "Nueva posibilidad o decisión.",
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

export function ListeningAnalyticsView({
  listeningEvents,
}: ListeningAnalyticsViewProps) {
  const levelCounts = getLevelCounts(listeningEvents);
  const totalEvents = listeningEvents.length;
  const lowLevelEvents = listeningEvents.filter(
    (event) => event.level === "download" || event.level === "debate",
  ).length;
  const highLevelEvents = totalEvents - lowLevelEvents;
  const highLevelRatio = totalEvents
    ? Math.round((highLevelEvents / totalEvents) * 100)
    : 0;
  const lowLevelRatio = totalEvents
    ? Math.round((lowLevelEvents / totalEvents) * 100)
    : 0;
  const dominantLevel = levelCounts.reduce(
    (currentDominant, currentLevel) =>
      currentLevel.count > currentDominant.count
        ? currentLevel
        : currentDominant,
    levelCounts[0],
  );
  const dominantLevelLabel =
    dominantLevel.count > 0 ? levelMeta[dominantLevel.level].label : "Sin datos";

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
      <DashboardFloatingNav activeView="escucha" onViewChange={() => {}} />

      <section className="mx-auto w-full max-w-7xl px-6 pb-10 pt-28 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Vista del gerente
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Analítica de escucha
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Observa cómo evoluciona la práctica de escucha del equipo por
              nivel y registros recientes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/escucha"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Abrir evaluación
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
              label: "Escucha inicial",
              value: `${lowLevelRatio}%`,
              detail: "Descarga o factual",
              icon: BarChart3,
            },
            {
              label: "Nivel predominante",
              value: dominantLevelLabel,
              detail: "Mayor volumen actual",
              icon: MessageSquareText,
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
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

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
                Últimos registros
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

          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
                        {new Date(event.createdAt).toLocaleString("es-HN")}
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

        <section className="mt-6 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-1 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-950">
                  Próximo paso
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Cuando exista la tabla de evaluaciones diarias, esta vista podrá mostrar porcentajes por día, cambios percibidos y relación con comentarios críticos.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard#equipo"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              Ver equipo
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

"use client";

import { CalendarDays, CircleAlert, MessageSquareText } from "lucide-react";

import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import { getListeningCollaboratorSummaries } from "@/domain/listening/daily-summary";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import { DashboardFloatingNav } from "../dashboard-floating-nav";
import type { DashboardCurrentUser } from "../dashboard-user-menu";
import { PlatformFooter } from "@/components/platform-footer";
import { ListeningBranchFilter } from "./listening-branch-filter";
import { buildListeningSectionHref } from "./listening-section-tabs";

type ListeningCoachingViewProps = {
  listeningEvents: ListeningEventRow[];
  currentUser?: DashboardCurrentUser;
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchIds: string[];
  lockedBranchScope?: boolean;
};

export function ListeningCoachingView({
  listeningEvents,
  currentUser,
  dateRange,
  branches,
  selectedBranchIds,
  lockedBranchScope = false,
}: ListeningCoachingViewProps) {
  const collaboratorSummaries = getListeningCollaboratorSummaries(listeningEvents);

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <DashboardFloatingNav
        activeView="escucha"
        onViewChange={() => {}}
        currentUser={currentUser}
        listeningSubNav={{
          activeTab: "coaching",
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
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Coaching de escucha
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Revisa señales individuales para identificar conversaciones de
              acompañamiento y oportunidades de mejora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardDateFilter
              dateRange={dateRange}
              basePath="/dashboard/escucha/coaching"
              selectedBranchIds={selectedBranchIds}
            />
            <ListeningBranchFilter
              dateRange={dateRange}
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              lockedBranchScope={lockedBranchScope}
              basePath="/dashboard/escucha/coaching"
            />
          </div>
        </header>

        <section className="mt-8 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Evaluación individual
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Lectura por colaborador dentro del periodo y sucursales
                seleccionadas.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {dateRange.label}
            </span>
          </div>

          {collaboratorSummaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    {[
                      "Colaborador",
                      "Sucursal",
                      "Registros",
                      "Media",
                      "Moda",
                      "Último nivel",
                      "Última nota",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {collaboratorSummaries.map((summary) => (
                    <tr key={summary.userId} className="align-top">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-950">
                          {summary.userName}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {summary.branchName}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                        {summary.eventCount}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-950">
                          {summary.averageLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.nearestLevelLabel}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-950">
                          {summary.modeLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {summary.modeDetail}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                        {summary.lastLevelLabel}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-sm leading-6 text-slate-600">
                        {summary.lastNote ?? "Sin nota registrada."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <CircleAlert className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-950">
                Sin evaluaciones individuales en este periodo
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Cuando los colaboradores registren su nivel de escucha,
                aparecerán aquí para apoyar conversaciones de coaching.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-1 h-5 w-5 shrink-0 text-emerald-800" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-950">
                Uso sugerido
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Usa esta vista para preparar conversaciones puntuales: revisar
                la tendencia individual, abrir preguntas y acordar una acción de
                mejora concreta.
              </p>
            </div>
          </div>
        </section>
        <PlatformFooter />
      </section>
    </main>
  );
}

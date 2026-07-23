"use client";

import { CalendarDays, CircleAlert, Info, X } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import { PlatformFooter } from "@/components/platform-footer";
import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardNotification } from "@/domain/dashboard/schemas";
import {
  getListeningCollaboratorSummaries,
  type ListeningCollaboratorSummary,
} from "@/domain/listening/daily-summary";
import {
  getListeningCoachingPriorities,
  type CoachingPriorityItem,
} from "@/domain/listening/coaching-priority";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import { DashboardFloatingNav } from "../dashboard-floating-nav";
import type { DashboardCurrentUser } from "../dashboard-user-menu";
import { ListeningBranchFilter } from "./listening-branch-filter";
import { ListeningCoachingDrawer } from "./listening-coaching-drawer";
import { buildListeningSectionHref } from "./listening-section-tabs";

type ListeningCoachingViewProps = {
  listeningEvents: ListeningEventRow[];
  currentUser?: DashboardCurrentUser;
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchIds: string[];
  lockedBranchScope?: boolean;
  canManageListening?: boolean;
  canViewNotifications?: boolean;
  notifications?: DashboardNotification[];
};

function urgencyLabel(urgency: CoachingPriorityItem["urgency"]) {
  return urgency === "high" ? "Alta" : "Media";
}

function urgencyClass(urgency: CoachingPriorityItem["urgency"]) {
  return urgency === "high"
    ? "bg-slate-900 text-white"
    : "bg-slate-200 text-slate-800";
}

export function ListeningCoachingView({
  listeningEvents,
  currentUser,
  dateRange,
  branches,
  selectedBranchIds,
  lockedBranchScope = false,
  canManageListening = false,
  canViewNotifications = false,
  notifications = [],
}: ListeningCoachingViewProps) {
  const collaboratorSummaries = getListeningCollaboratorSummaries(listeningEvents);
  const priorities = useMemo(
    () => getListeningCoachingPriorities(collaboratorSummaries, listeningEvents),
    [collaboratorSummaries, listeningEvents],
  );
  const [selectedSummary, setSelectedSummary] =
    useState<ListeningCollaboratorSummary | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const selectedEvents = useMemo(() => {
    if (!selectedSummary) return [];
    return listeningEvents.filter(
      (event) => event.userId === selectedSummary.userId,
    );
  }, [listeningEvents, selectedSummary]);

  function openCollaborator(
    summary: ListeningCollaboratorSummary,
    reasons: string[] = [],
  ) {
    setSelectedSummary(summary);
    setSelectedReasons(reasons);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <DashboardFloatingNav
        activeView="escucha"
        onViewChange={() => {}}
        currentUser={currentUser}
        canViewNotifications={canViewNotifications}
        notifications={canViewNotifications ? notifications : []}
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-normal text-slate-950">
                Coaching de escucha
              </h1>
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
                aria-label="Cómo funciona el coaching de escucha"
                title="Cómo funciona"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Empieza por quienes más lo necesitan esta semana. El resto queda
              en la lista completa.
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

        {priorities.length > 0 ? (
          <section className="mt-8 rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Prioridad esta semana
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Selección automática por señales de escucha. Abre solo estos
                  casos primero.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {dateRange.label}
              </span>
            </div>

            <ul className="mt-5 divide-y divide-slate-100">
              {priorities.map((item) => (
                <li key={item.summary.userId}>
                  <button
                    type="button"
                    onClick={() =>
                      openCollaborator(item.summary, item.reasons)
                    }
                    className="flex w-full items-start justify-between gap-4 py-4 text-left transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.summary.userName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyClass(item.urgency)}`}
                        >
                          {urgencyLabel(item.urgency)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.reasons.join(" · ")}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-slate-400">
                      {item.summary.branchName}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Evaluación individual
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Lista completa del periodo. Úsala si quieres revisar a alguien
                fuera de prioridad.
              </p>
            </div>
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
                    <tr
                      key={summary.userId}
                      className="cursor-pointer align-top transition hover:bg-slate-50/80"
                      onClick={() => openCollaborator(summary)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openCollaborator(summary);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Abrir coaching de ${summary.userName}`}
                    >
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
        <PlatformFooter />
      </section>

      <ListeningCoachingDrawer
        open={Boolean(selectedSummary)}
        onClose={() => {
          setSelectedSummary(null);
          setSelectedReasons([]);
        }}
        summary={selectedSummary}
        events={selectedEvents}
        canManage={canManageListening}
        priorityReasons={selectedReasons}
      />

      {isInfoOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
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
            aria-labelledby="coaching-info-title"
            className="relative w-full max-w-lg rounded-[1.35rem] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
          >
            <button
              type="button"
              onClick={() => setIsInfoOpen(false)}
              className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Cerrar</span>
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Cómo funciona
            </p>
            <h2
              id="coaching-info-title"
              className="mt-2 pr-12 text-xl font-semibold text-slate-950"
            >
              Coaching de escucha
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">Prioridad:</span>{" "}
                el sistema marca solo a quienes muestran señales (bajó de nivel,
                sin registros, media baja). No tienes que revisar a todos.
              </p>
              <p>
                <span className="font-semibold text-slate-950">Prep:</span> al
                abrir a alguien, Perks sugiere una lectura corta y preguntas
                privadas para tu conversación. No se envían al colaborador.
              </p>
              <p>
                <span className="font-semibold text-slate-950">Acordamos:</span>{" "}
                después de hablar, anota una acción concreta para no olvidarla
                la próxima vez.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

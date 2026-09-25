"use client";

/* Hallmark · genre: editorial · macrostructure: Index-First · theme: Perks
 * design-system: existing dashboard tokens · designed-as-app
 * Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 */

import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { Branch } from "@/domain/branches/schemas";
import {
  filterDashboardAlerts,
  type DashboardAlertItem,
  type DashboardAlertStatusFilter,
} from "@/domain/dashboard/alerts";
import type { DashboardFollowUpMetrics } from "@/domain/dashboard/schemas";
import type {
  AlertEscalationSettings,
  OrganizationSettings,
} from "@/domain/organizations/organization-settings-schemas";
import type { TeamMember } from "@/domain/organizations/team";

import { DashboardAlertCard } from "./dashboard-alert-card";
import { DashboardAlertsEscalationSettingsPanel } from "./dashboard-alerts-escalation-settings-panel";
import { DashboardSection } from "./dashboard-section";
import { SlaTerm } from "./sla-term";

const ESCALATION_TIP_DISMISS_KEY = "perks.dashboard.alerts.escalation-tip.dismissed";
const ALERTS_PAGE_SIZE = 6;

const statusFilters: Array<{ value: DashboardAlertStatusFilter; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "nuevo", label: "Nuevas" },
  { value: "en_revision", label: "En revisión" },
  { value: "escalado", label: "Escaladas" },
];

function subscribeToEscalationTipDismissed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function isEscalationTipDismissed() {
  return localStorage.getItem(ESCALATION_TIP_DISMISS_KEY) === "1";
}

function sortAlertsForWork(alerts: DashboardAlertItem[]) {
  const toneRank = { danger: 0, warning: 1, success: 2 } as const;

  return [...alerts].sort((left, right) => {
    const slaDelta =
      Number(Boolean(right.slaBreached)) - Number(Boolean(left.slaBreached));
    if (slaDelta !== 0) {
      return slaDelta;
    }

    return toneRank[left.tone] - toneRank[right.tone];
  });
}

function formatHours(value: number | null) {
  if (value === null) {
    return "-";
  }

  if (value < 1) {
    return `${Math.round(value * 60)} min`;
  }

  return `${value.toFixed(1)} h`;
}

type DashboardAlertsViewProps = {
  alerts: DashboardAlertItem[];
  metrics: DashboardFollowUpMetrics;
  branches?: Branch[];
  assignees?: TeamMember[];
  organizationSettings?: OrganizationSettings | null;
  canManageEscalation?: boolean;
  canManageFollowUp?: boolean;
  onEscalationSettingsSaved?: (settings: AlertEscalationSettings) => void;
  onOpenSubmission?: (submissionId: string) => void;
};

export function DashboardAlertsView({
  alerts,
  metrics,
  branches = [],
  assignees = [],
  organizationSettings,
  canManageEscalation = false,
  canManageFollowUp = false,
  onEscalationSettingsSaved,
  onOpenSubmission,
}: DashboardAlertsViewProps) {
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [statusFilter, setStatusFilter] = useState<DashboardAlertStatusFilter>("todos");
  const [branchFilter, setBranchFilter] = useState("");
  const [slaOnly, setSlaOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tipDismissedOverride, setTipDismissedOverride] = useState(false);
  const [escalationOverride, setEscalationOverride] =
    useState<AlertEscalationSettings | null>(null);
  const tipDismissedFromStorage = useSyncExternalStore(
    subscribeToEscalationTipDismissed,
    isEscalationTipDismissed,
    () => false,
  );
  const isTipVisible = !tipDismissedFromStorage && !tipDismissedOverride;

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const next = filterDashboardAlerts(localAlerts, {
      status: statusFilter,
      branchId: branchFilter || null,
    }).filter((alert) => (slaOnly ? Boolean(alert.slaBreached) : true));

    return sortAlertsForWork(next);
  }, [branchFilter, localAlerts, slaOnly, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, branchFilter, slaOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / ALERTS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ALERTS_PAGE_SIZE;
  const pagedAlerts = filteredAlerts.slice(
    pageStart,
    pageStart + ALERTS_PAGE_SIZE,
  );

  const escalationPhone =
    escalationOverride?.alertEscalationPhone ??
    organizationSettings?.alertEscalationPhone ??
    null;
  const escalationEmail =
    escalationOverride?.alertEscalationEmail ??
    organizationSettings?.alertEscalationEmail ??
    null;

  function dismissTip() {
    setTipDismissedOverride(true);
    localStorage.setItem(ESCALATION_TIP_DISMISS_KEY, "1");
  }

  function handleSettingsSaved(settings: AlertEscalationSettings) {
    setEscalationOverride(settings);
    onEscalationSettingsSaved?.(settings);
  }

  function handleAlertUpdated(alertId: string, next: Partial<DashboardAlertItem>) {
    setLocalAlerts((current) =>
      current.map((alert) => (alert.id === alertId ? { ...alert, ...next } : alert)),
    );
  }

  function handleAlertRemoved(alertId: string) {
    setLocalAlerts((current) => current.filter((alert) => alert.id !== alertId));
  }

  const visibleCaseCount = filteredAlerts.length;

  return (
    <>
      <DashboardSection
        id="alertas"
        title="Alertas"
        titleMeta={
          visibleCaseCount === 0
            ? "Sin casos en vista"
            : visibleCaseCount === 1
              ? "1 caso en vista"
              : `${visibleCaseCount} casos en vista`
        }
        description="Actualiza estado, responsable y notas sin salir de aquí."
        action={
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-2 text-sm font-semibold text-brand-muted transition hover:text-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:translate-y-px"
          >
            <Settings2 size={16} aria-hidden="true" />
            Contacto de aviso
          </button>
        }
      >
        <div>
          {isTipVisible && !escalationEmail ? (
            <div className="border-y border-border-soft py-4">
              <p className="text-sm font-semibold text-text-primary">
                Configura un correo de escalamiento
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                Cuando un caso pase a escalado, Perks puede avisar automáticamente.
              </p>
              <button
                type="button"
                onClick={dismissTip}
                className="mt-2 inline-flex h-11 items-center text-sm font-semibold text-brand-muted transition hover:text-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
              >
                Entendido
              </button>
            </div>
          ) : null}

          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border-soft py-4 text-sm leading-6 text-text-secondary">
            <span className="font-semibold text-text-primary">
              {metrics.openCount}{" "}
              {metrics.openCount === 1 ? "abierto" : "abiertos"}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {metrics.inReviewCount} en revisión
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                metrics.escalatedCount > 0
                  ? "font-semibold text-signal-danger-ink"
                  : undefined
              }
            >
              {metrics.escalatedCount}{" "}
              {metrics.escalatedCount === 1 ? "escalado" : "escalados"}
            </span>
            <span aria-hidden="true">·</span>
            {metrics.slaBreachedCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-signal-danger-ink">
                {metrics.slaBreachedCount}
                <SlaTerm variant="metric" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                0 <SlaTerm variant="metric" />
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>Respuesta {formatHours(metrics.avgResponseHours)}</span>
          </p>

          <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div
              className="flex min-w-0 flex-wrap gap-x-1"
              role="tablist"
              aria-label="Filtrar alertas por estado"
            >
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                const count = filterDashboardAlerts(localAlerts, {
                  status: filter.value,
                  branchId: branchFilter || null,
                }).filter((alert) => (slaOnly ? Boolean(alert.slaBreached) : true)).length;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(filter.value)}
                    className={[
                      "inline-flex h-11 items-center border-b-2 px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-brand-muted text-brand-muted"
                        : "border-transparent text-text-secondary hover:text-text-primary",
                    ].join(" ")}
                  >
                    {filter.label}
                    <span className="ml-1.5 font-medium text-text-secondary">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                aria-pressed={slaOnly}
                onClick={() => setSlaOnly((current) => !current)}
                className={[
                  "inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium transition focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
                  slaOnly
                    ? "bg-signal-danger-paper text-signal-danger-ink"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                ].join(" ")}
              >
                SLA vencido
              </button>
              {branches.length > 1 ? (
                <label className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">
                    Sucursal
                  </span>
                  <select
                    value={branchFilter}
                    onChange={(event) => setBranchFilter(event.target.value)}
                    className="field-control h-9 min-w-0 max-w-full rounded-md bg-surface px-3 text-[13px] text-text-primary"
                  >
                    <option value="">Todas</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          {filteredAlerts.length > 0 ? (
            <>
            <div className="grid gap-3 md:grid-cols-2">
              {pagedAlerts.map((alert) => (
                <DashboardAlertCard
                  key={alert.id}
                  alert={alert}
                  assignees={assignees}
                  canManage={canManageFollowUp}
                  onOpenSubmission={onOpenSubmission}
                  onUpdated={handleAlertUpdated}
                  onRemoved={handleAlertRemoved}
                />
              ))}
            </div>
            {filteredAlerts.length > ALERTS_PAGE_SIZE ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-text-secondary">
                  {pageStart + 1}-{pageStart + pagedAlerts.length} de{" "}
                  {filteredAlerts.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex size-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Pagina anterior"
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                  </button>
                  <span className="min-w-16 text-center text-[13px] font-medium text-text-secondary">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex size-9 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Pagina siguiente"
                  >
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}
            </>
          ) : (
            <div className="flex flex-col items-start gap-5 rounded-2xl bg-surface px-5 py-8 sm:flex-row sm:items-center sm:px-6">
              <img
                src="/images/illustrations/perks-empty-attention-v1.svg"
                alt=""
                width={120}
                height={96}
                className="h-auto w-22 shrink-0"
              />
              <div>
              <p className="text-sm font-semibold text-text-primary">
                Sin alertas en este filtro
              </p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
                Cuando haya quejas, casos críticos o seguimientos pendientes
                aparecerán aquí.
              </p>
              </div>
            </div>
          )}
        </div>
      </DashboardSection>

      <DashboardAlertsEscalationSettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={{
          alertEscalationPhone: escalationPhone,
          alertEscalationEmail: escalationEmail,
        }}
        canManage={canManageEscalation}
        onSaved={handleSettingsSaved}
      />
    </>
  );
}

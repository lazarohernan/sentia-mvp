"use client";

import { Settings2, ShieldAlert } from "lucide-react";
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
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardSection } from "./dashboard-section";

const ESCALATION_TIP_DISMISS_KEY = "perks.dashboard.alerts.escalation-tip.dismissed";

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

function formatHours(value: number | null) {
  if (value === null) {
    return "—";
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

  const filteredAlerts = useMemo(
    () =>
      filterDashboardAlerts(localAlerts, {
        status: statusFilter,
        branchId: branchFilter || null,
      }),
    [branchFilter, localAlerts, statusFilter],
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

  return (
    <>
      <DashboardSection
        id="alertas"
        title="Alertas"
        description="Casos que requieren atención. Actualiza estado, responsable y notas sin salir de aquí."
        action={
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
          >
            <Settings2 size={16} aria-hidden="true" />
            Contacto
          </button>
        }
      >
        <div className="space-y-5">
          {isTipVisible && !escalationEmail ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-950">
              <p className="font-semibold">Configura un correo de escalamiento</p>
              <p className="mt-1 text-amber-900/90">
                Cuando un caso pase a escalado, Perks puede avisar automáticamente.
              </p>
              <button
                type="button"
                onClick={dismissTip}
                className="mt-2 text-xs font-semibold text-amber-900 underline"
              >
                Entendido
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Abiertos", value: metrics.openCount },
              { label: "En revisión", value: metrics.inReviewCount },
              { label: "Escalados", value: metrics.escalatedCount },
              { label: "SLA vencido", value: metrics.slaBreachedCount },
              { label: "Respuesta prom.", value: formatHours(metrics.avgResponseHours) },
            ].map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{metric.value}</p>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={[
                      "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {branches.length > 1 ? (
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Sucursal</span>
                <select
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-700/10"
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

          {filteredAlerts.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredAlerts.map((alert) => (
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
          ) : (
            <DashboardEmptyState
              icon={ShieldAlert}
              title="Sin alertas en este filtro"
              description="Cuando haya quejas, casos críticos o seguimientos pendientes aparecerán aquí."
            />
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

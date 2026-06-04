"use client";

import { AlertTriangle, Clock3, Settings2, ShieldAlert, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardFollowUpMetrics } from "@/domain/dashboard/schemas";
import type {
  AlertEscalationSettings,
  OrganizationSettings,
} from "@/domain/organizations/organization-settings-schemas";

import { DashboardAlertsEscalationSettingsPanel } from "./dashboard-alerts-escalation-settings-panel";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardSection } from "./dashboard-section";

const ESCALATION_TIP_DISMISS_KEY = "perks.dashboard.alerts.escalation-tip.dismissed";

function subscribeToEscalationTipDismissed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function isEscalationTipDismissed() {
  return localStorage.getItem(ESCALATION_TIP_DISMISS_KEY) === "1";
}

type DashboardAlertsViewProps = {
  alerts: DashboardAlertItem[];
  metrics: DashboardFollowUpMetrics;
  organizationSettings?: OrganizationSettings | null;
  canManageEscalation?: boolean;
  onEscalationSettingsSaved?: (settings: AlertEscalationSettings) => void;
  onOpenSubmission?: (submissionId: string) => void;
};

function formatHours(value: number | null) {
  if (value === null) {
    return "Sin datos";
  }

  if (value < 1) {
    return `${Math.round(value * 60)} min`;
  }

  return `${value.toFixed(1)} h`;
}

function extractSubmissionId(alertId: string) {
  if (!alertId.startsWith("submission-")) {
    return null;
  }

  return alertId.replace("submission-", "");
}

function EscalationTipBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-[#f7f8f4] p-4 pr-12">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800"
        aria-label="Cerrar aviso"
      >
        <X size={16} aria-hidden="true" />
      </button>
      <p className="text-sm font-semibold text-slate-900">
        Contacto de escalamiento
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Puedes guardar a quién avisar cuando un caso sea crítico o escalado. El
        seguimiento de cada caso se registra en Valoraciones.
      </p>
    </div>
  );
}

export function DashboardAlertsView({
  alerts,
  metrics,
  organizationSettings,
  canManageEscalation = false,
  onEscalationSettingsSaved,
  onOpenSubmission,
}: DashboardAlertsViewProps) {
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

  return (
    <>
      <DashboardSection
        id="alertas"
        title="Alertas"
        description="Situaciones que requieren atención o seguimiento."
        action={
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
          >
            <Settings2 size={16} aria-hidden="true" />
            Configurar contacto
          </button>
        }
      >
        <div className="space-y-6">
          {isTipVisible ? <EscalationTipBanner onDismiss={dismissTip} /> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Casos abiertos
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {metrics.openCount}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Escalados
              </p>
              <p className="mt-2 text-3xl font-semibold text-rose-700">
                {metrics.escalatedCount}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Tiempo promedio de respuesta
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-950">
                <Clock3 size={20} className="text-emerald-700" aria-hidden="true" />
                {formatHours(metrics.avgResponseHours)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Tiempo promedio de resolución
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-950">
                <Clock3 size={20} className="text-emerald-700" aria-hidden="true" />
                {formatHours(metrics.avgResolutionHours)}
              </p>
            </article>
          </div>

          {alerts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((alert) => {
                const submissionId = extractSubmissionId(alert.id);

                return (
                  <article
                    key={alert.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">
                          {alert.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{alert.subtitle}</p>
                      </div>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          alert.tone === "danger"
                            ? "bg-red-50 text-red-700"
                            : alert.tone === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-800",
                        ].join(" ")}
                      >
                        {alert.priority}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {alert.detail}
                    </p>
                    {submissionId && onOpenSubmission ? (
                      <button
                        type="button"
                        onClick={() => onOpenSubmission(submissionId)}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      >
                        <AlertTriangle size={16} aria-hidden="true" />
                        Abrir seguimiento
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <DashboardEmptyState
              icon={ShieldAlert}
              title="Sin alertas abiertas"
              description="Las alertas aparecerán cuando haya quejas, casos críticos o seguimientos pendientes."
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
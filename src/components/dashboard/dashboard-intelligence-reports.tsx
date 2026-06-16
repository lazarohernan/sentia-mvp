"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  History,
  Loader2,
  Sparkles,
  X,
  Mail,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { buildDashboardAnomalies } from "@/domain/dashboard/anomalies";
import {
  buildReportEmailHref,
  buildReportPrintHtml,
  getReportRecipientEmail,
  type ReportDeliveryChannel,
  type ReportDeliveryRecord,
} from "@/domain/dashboard/report-delivery";
import {
  buildBranchReports,
  buildReportReadiness,
} from "@/domain/dashboard/report-readiness";
import type { AgentOperationalReport } from "@/domain/agent/context";
import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

const REPORT_HISTORY_STORAGE_PREFIX = "perks.dashboard.report-delivery.history";
// Agent UI is intentionally paused while the core operational roadmap is completed.
const SHOW_AGENT_UI = false;

function getReportHistoryStorageKey(scope: string) {
  return `${REPORT_HISTORY_STORAGE_PREFIX}.${scope}`;
}

function formatHistoryTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function readReportHistory(scope: string): ReportDeliveryRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = window.localStorage.getItem(getReportHistoryStorageKey(scope));
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as ReportDeliveryRecord[];
  } catch {
    return [];
  }
}

function createDeliveryRecord(params: {
  channel: ReportDeliveryChannel;
  label: string;
  recipient?: string | null;
}): ReportDeliveryRecord {
  const createdAt = new Date().toISOString();
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : createdAt;

  return {
    id: `${params.channel}-${suffix}`,
    createdAt,
    channel: params.channel,
    label: params.label,
    recipient: params.recipient,
  };
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-100 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function mapDashboardPeriodToAgentPeriod(period?: string) {
  return period === "30d" ? "30d" : "7d";
}

export function DashboardIntelligenceReports({
  dashboardData,
  organizationName,
  organizationSettings,
  currentUserEmail,
  initialAgentReport,
}: {
  dashboardData?: DashboardSummaryData;
  organizationName?: string;
  organizationSettings?: OrganizationSettings;
  currentUserEmail?: string | null;
  initialAgentReport?: AgentOperationalReport | null;
}) {
  const [showReadinessNote, setShowReadinessNote] = useState(true);
  const comments = dashboardData?.comments ?? [];
  const [agentReport, setAgentReport] = useState<AgentOperationalReport | null>(
    initialAgentReport ?? null,
  );
  const [isGeneratingAgentReport, setIsGeneratingAgentReport] = useState(false);
  const [agentReportError, setAgentReportError] = useState<string | null>(null);
  const reports = buildBranchReports(comments);
  const readiness = buildReportReadiness(comments, reports);
  const priorityBranch = reports[0];
  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const riskCount = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const analyzedCount = comments.filter((comment) => comment.analysisModel).length;
  const anomalies = buildDashboardAnomalies(comments);
  const historyScope = useMemo(
    () => organizationSettings?.id ?? organizationName ?? "demo",
    [organizationName, organizationSettings?.id],
  );
  const [deliveryHistory, setDeliveryHistory] = useState<ReportDeliveryRecord[]>(() =>
    readReportHistory(historyScope),
  );
  const recipientEmail = getReportRecipientEmail({
    organizationSettings,
    currentUserEmail,
  });
  const knowledgeEntries = [
    organizationSettings?.peakHours,
    organizationSettings?.servicePriorities,
    organizationSettings?.compensationPolicy,
    organizationSettings?.followUpTone,
    organizationSettings?.agentNotes,
  ].filter(Boolean).length;
  const emailHref = recipientEmail
    ? buildReportEmailHref({
        organizationName,
        periodLabel: dashboardData?.period ?? "Últimos 7 días",
        readiness,
        priorityBranch,
        recipientEmail,
      })
    : null;

  function persistDeliveryRecord(channel: ReportDeliveryChannel, recipient?: string | null) {
    const label =
      channel === "pdf"
        ? "Exportación preliminar en PDF"
        : recipient
          ? `Correo preparado para ${recipient}`
          : "Correo preparado";
    const nextEntry = createDeliveryRecord({ channel, label, recipient });
    const nextHistory = [nextEntry, ...deliveryHistory].slice(0, 8);
    setDeliveryHistory(nextHistory);
    window.localStorage.setItem(
      getReportHistoryStorageKey(historyScope),
      JSON.stringify(nextHistory),
    );
  }

  function handleExportPdf() {
    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) {
      return;
    }

    reportWindow.document.open();
    reportWindow.document.write(
      buildReportPrintHtml({
        organizationName,
        periodLabel: dashboardData?.period ?? "Últimos 7 días",
        readiness,
        priorityBranch,
        reports,
        comments,
      }),
    );
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => {
      reportWindow.print();
    }, 250);

    persistDeliveryRecord("pdf");
  }

  function handlePrepareEmail() {
    persistDeliveryRecord("email", recipientEmail);
  }

  async function handleGenerateAgentReport() {
    setIsGeneratingAgentReport(true);
    setAgentReportError(null);

    try {
      const response = await fetch("/api/agent/report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          period: mapDashboardPeriodToAgentPeriod(dashboardData?.dateRange.period),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { report?: AgentOperationalReport; error?: string }
        | null;

      if (!response.ok || !body?.report) {
        throw new Error(body?.error ?? "No se pudo generar la lectura del agente.");
      }

      setAgentReport(body.report);
    } catch (error) {
      setAgentReportError(
        error instanceof Error
          ? error.message
          : "No se pudo generar la lectura del agente.",
      );
    } finally {
      setIsGeneratingAgentReport(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        {readiness.missingUsefulResponses > 0 && showReadinessNote ? (
          <div className="pointer-events-none absolute left-8 right-8 top-[-2.35rem] z-0">
            <div className="pointer-events-auto grid min-h-[5.15rem] grid-cols-[1fr_auto_1fr] items-start rounded-t-[1.2rem] rounded-br-[1rem] border border-slate-200/85 bg-[rgba(255,255,255,0.78)] px-5 pb-7 pt-4 text-[15px] font-medium text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-lg">
              <div />
              <span className="max-w-[34rem] text-center leading-6">
                No hay suficiente información para entregar el informe aún.
              </span>
              <button
                type="button"
                onClick={() => setShowReadinessNote(false)}
                className="justify-self-end inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-900"
                aria-label="Cerrar aviso de preparación del informe"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        <section
          className={`relative z-10 rounded-[1.35rem] border border-slate-200 bg-white p-5 ${
            readiness.missingUsefulResponses > 0 && showReadinessNote ? "mt-9" : ""
          }`}
        >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Preparación del informe mensual
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
              {readiness.percent}% listo
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {readiness.missingUsefulResponses > 0
                ? `Faltan ${readiness.missingUsefulResponses} valoraciones útiles para explicar mejor los patrones por sucursal.`
                : "La base actual permite preparar un informe mensual con buena claridad."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {readiness.usefulResponses.toFixed(1)} /{" "}
                {readiness.targetUsefulResponses} respuestas útiles
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {readiness.qualityPercent}% claridad
              </span>
              {priorityBranch ? (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {priorityBranch.branch} requiere más contexto
                </span>
              ) : null}
            </div>
          </div>

          <div className="w-full border-t border-slate-100 pt-5 lg:max-w-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Avance
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {readiness.percent}%
              </p>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Preparación del informe mensual"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readiness.percent}
            >
              <div
                className="h-full rounded-full bg-slate-700 transition-all"
                style={{ width: `${readiness.percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              El avance se calcula según cuántas respuestas llegan con motivo claro
              y detalle útil para explicar el patrón del periodo.
            </p>
          </div>
        </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Valoraciones"
          value={comments.length.toString()}
          detail={`Periodo: ${dashboardData?.period ?? "Últimos 7 días"}.`}
        />
        <MetricCard
          label="Analizadas"
          value={analyzedCount.toString()}
          detail="Comentarios con lectura guardada por IA."
        />
        <MetricCard
          label="Requieren contexto"
          value={weakDataCount.toString()}
          detail="Valoraciones ambiguas o sin motivo operativo claro."
        />
        <MetricCard
          label="Riesgo"
          value={riskCount.toString()}
          detail="Casos que conviene revisar antes del próximo informe."
        />
      </section>

      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Detección de anomalías
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cambios bruscos entre la ventana reciente y la anterior para no
              depender solo del promedio general.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Comparación reciente vs previa
          </span>
        </div>

        {anomalies.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {anomalies.map((anomaly) => (
              <article
                key={`${anomaly.branch}-${anomaly.title}`}
                className="rounded-[1.15rem] border border-slate-100 bg-[#f7f8f4] p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      anomaly.tone === "danger"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {anomaly.branch}
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-slate-950">
                      {anomaly.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {anomaly.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.15rem] border border-dashed border-slate-200 p-6 text-sm leading-6 text-slate-500">
            Aún no hay variaciones suficientemente bruscas para marcar una anomalía
            operativa en este periodo.
          </div>
        )}
      </section>

      {SHOW_AGENT_UI ? (
        <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Sparkles className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Lectura del agente operativo
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {knowledgeEntries > 0
                    ? `Base operativa configurada: ${knowledgeEntries} bloques`
                    : "Base operativa pendiente"}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {agentReport
                  ? agentReport.headline
                  : "Ejecuta el agente para consolidar una lectura operativa del periodo"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {agentReport
                  ? agentReport.summary
                  : "El agente toma las señales del tenant activo, prioriza sucursales y devuelve una síntesis operativa en lenguaje natural."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAgentReport}
              disabled={isGeneratingAgentReport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingAgentReport ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {isGeneratingAgentReport ? "Generando lectura..." : "Generar lectura"}
            </button>
          </div>

          {agentReportError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {agentReportError}
            </div>
          ) : null}

          {agentReport ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.1rem] border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Siguiente paso
                </p>
                <div className="mt-3 space-y-3">
                  {agentReport.nextActions.map((action) => (
                    <p key={action} className="text-sm leading-6 text-slate-700">
                      {action}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.1rem] border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Estado de entrega
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {agentReport.deliveryReadiness}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Generado: {formatHistoryTimestamp(agentReport.generatedAt)}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Patrones por establecimiento
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              La plataforma separa señales claras de datos que necesitan una
              mejor pregunta de captura.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Base para informe semanal y mensual
          </span>
        </div>

        {reports.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report.branch}
                className="rounded-[1.15rem] border border-slate-100 bg-[#f7f8f4] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Sucursal
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-slate-950">
                      {report.branch}
                    </h4>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {report.total} valoraciones
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-lg font-semibold text-rose-700">
                      {report.risk}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">Riesgo</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-lg font-semibold text-slate-700">
                      {report.neutral}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">Neutro</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-lg font-semibold text-emerald-700">
                      {report.positive}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      Positivo
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Patrón dominante
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {report.topPattern}
                  </p>
                </div>

                <div className="mt-3 rounded-xl bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Preparación mensual
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {report.readinessPercent}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`Preparación mensual de ${report.branch}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={report.readinessPercent}
                  >
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{ width: `${report.readinessPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {report.usefulResponses.toFixed(1)} de{" "}
                    {report.targetUsefulResponses} respuestas útiles.
                  </p>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3">
                  {report.insufficient + report.partial > 0 ? (
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-sm leading-6 text-slate-600">
                    {report.insufficient + report.partial} valoraciones necesitan
                    más detalle para explicar la causa.
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {report.recommendedAction}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.15rem] border border-dashed border-slate-200 p-6 text-sm leading-6 text-slate-500">
            Aún no hay valoraciones suficientes para construir patrones por
            establecimiento.
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Entrega del informe
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {readiness.missingUsefulResponses > 0
                  ? "Borrador operativo listo para revisión"
                  : "Informe listo para compartir"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Exporta esta lectura en PDF o prepara el correo desde la misma base
                que ya ve gerencia en el panel.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {dashboardData?.period ?? "Últimos 7 días"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar PDF
            </button>
            {emailHref ? (
              <a
                href={emailHref}
                onClick={handlePrepareEmail}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Preparar correo
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Configura un correo
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Entrega por defecto
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                Semanal para operación y mensual para gerencia.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Estado actual
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {readiness.missingUsefulResponses > 0
                  ? "Se enviaría como borrador preliminar."
                  : "Se puede enviar como informe consolidado."}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Destino actual
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {recipientEmail ?? "Sin correo configurado"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Historial de entregas
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Registro local de exportaciones y correos preparados desde este panel.
          </p>

          {deliveryHistory.length > 0 ? (
            <div className="mt-5 space-y-3">
              {deliveryHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {entry.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatHistoryTimestamp(entry.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {entry.channel === "pdf" ? "PDF" : "Correo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
              Aún no hay entregas registradas en esta vista.
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

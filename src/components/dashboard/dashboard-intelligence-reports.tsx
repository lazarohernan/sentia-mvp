"use client";

import { useEffect, useRef, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
  X,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { buildDashboardAnomalies } from "@/domain/dashboard/anomalies";
import {
  getReportCadenceMeta,
  getReportCadenceSettingMeta,
  reportPeriods,
  resolveReportPeriod,
  type ReportPeriod,
} from "@/domain/dashboard/report-cadence";
import { buildReportPrintHtml } from "@/domain/dashboard/report-delivery";
import {
  buildBranchReports,
  buildReportReadiness,
} from "@/domain/dashboard/report-readiness";
import type { AgentOperationalReport } from "@/domain/agent/context";
import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

// Agent UI is intentionally paused while the core operational roadmap is completed.
const SHOW_AGENT_UI = false;

function formatHistoryTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
    <div className="rounded-[1.15rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
  initialAgentReport,
  initialReportPeriod,
  autoOpenReport = false,
}: {
  dashboardData?: DashboardSummaryData;
  organizationName?: string;
  organizationSettings?: OrganizationSettings;
  initialAgentReport?: AgentOperationalReport | null;
  initialReportPeriod?: ReportPeriod;
  autoOpenReport?: boolean;
}) {
  const [showReadinessNote, setShowReadinessNote] = useState(true);
  const comments = dashboardData?.comments ?? [];
  const [agentReport, setAgentReport] = useState<AgentOperationalReport | null>(
    initialAgentReport ?? null,
  );
  const [isGeneratingAgentReport, setIsGeneratingAgentReport] = useState(false);
  const [agentReportError, setAgentReportError] = useState<string | null>(null);
  const [reportPreviewHtml, setReportPreviewHtml] = useState<string | null>(null);
  const [reportPreviewTitle, setReportPreviewTitle] = useState("Informe operativo");
  const reportPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const reportCadence = organizationSettings?.reportCadence ?? "monthly";
  const defaultReportPeriod: ReportPeriod =
    reportCadence === "monthly" ? "monthly" : "weekly";
  const [activeReportPeriod, setActiveReportPeriod] = useState<ReportPeriod>(
    initialReportPeriod ?? defaultReportPeriod,
  );
  const hasAutoOpenedRef = useRef(false);
  const effectiveReportPeriod = resolveReportPeriod(reportCadence, activeReportPeriod);
  const cadenceMeta = getReportCadenceMeta(effectiveReportPeriod);
  const cadenceSettingMeta = getReportCadenceSettingMeta(reportCadence);
  const reports = buildBranchReports(comments, reportCadence, activeReportPeriod);
  const readiness = buildReportReadiness(comments, reports, reportCadence, activeReportPeriod);
  const priorityBranch = reports[0];
  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const riskCount = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const analyzedCount = comments.filter((comment) => comment.analysisModel).length;
  const anomalies = buildDashboardAnomalies(comments);
  const knowledgeEntries = [
    organizationSettings?.peakHours,
    organizationSettings?.servicePriorities,
    organizationSettings?.compensationPolicy,
    organizationSettings?.followUpTone,
    organizationSettings?.agentNotes,
  ].filter(Boolean).length;

  useEffect(() => {
    if (initialReportPeriod) {
      setActiveReportPeriod(initialReportPeriod);
    }
  }, [initialReportPeriod]);

  useEffect(() => {
    hasAutoOpenedRef.current = false;
  }, [initialReportPeriod, autoOpenReport]);

  useEffect(() => {
    if (!autoOpenReport || hasAutoOpenedRef.current) {
      return;
    }

    if (readiness.missingUsefulResponses > 0) {
      return;
    }

    hasAutoOpenedRef.current = true;
    setReportPreviewTitle(cadenceMeta.previewTitle);
    setReportPreviewHtml(
      buildReportPrintHtml({
        organizationName,
        periodLabel: dashboardData?.period ?? cadenceMeta.periodLabel,
        reportTitle: cadenceMeta.previewTitle,
        readiness,
        priorityBranch,
        reports,
        comments,
      }),
    );
  }, [
    autoOpenReport,
    cadenceMeta.periodLabel,
    cadenceMeta.previewTitle,
    comments,
    dashboardData?.period,
    organizationName,
    priorityBranch,
    readiness,
    reports,
  ]);

  function handleExportPdf() {
    setReportPreviewTitle(cadenceMeta.previewTitle);
    const html = buildReportPrintHtml({
      organizationName,
      periodLabel: dashboardData?.period ?? cadenceMeta.periodLabel,
      reportTitle: cadenceMeta.previewTitle,
      readiness,
      priorityBranch,
      reports,
      comments,
    });
    setReportPreviewHtml(html);
  }

  function handlePrintPreview() {
    const previewWindow = reportPreviewFrameRef.current?.contentWindow;
    if (!previewWindow) {
      return;
    }

    previewWindow.focus();
    previewWindow.print();
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
      {reportPreviewHtml ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="flex h-[min(90vh,58rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Vista previa
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  {reportPreviewTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPreview}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Imprimir o guardar
                </button>
                <button
                  type="button"
                  onClick={() => setReportPreviewHtml(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Cerrar vista previa del informe"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-3">
              <iframe
                ref={reportPreviewFrameRef}
                title="Vista previa del informe"
                srcDoc={reportPreviewHtml}
                className="h-full w-full rounded-[1rem] bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}

      {reportCadence === "both" ? (
        <div className="flex w-fit max-w-full overflow-x-auto rounded-full bg-white p-1">
          {reportPeriods.map((period) => {
            const periodMeta = getReportCadenceMeta(period);
            const isActive = activeReportPeriod === period;

            return (
              <button
                key={period}
                type="button"
                onClick={() => setActiveReportPeriod(period)}
                aria-pressed={isActive}
                className={[
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition",
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {periodMeta.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
            {cadenceMeta.preparationTitle}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
            {readiness.percent}% listo
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {readiness.missingUsefulResponses > 0
              ? `Faltan ${readiness.missingUsefulResponses} valoraciones útiles para explicar mejor los patrones por sucursal.`
              : `La base actual permite preparar un informe ${cadenceMeta.shortLabel} con buena claridad.`}
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

          <div className="mt-6 border-t border-slate-100 pt-5">
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
              aria-label={cadenceMeta.preparationTitle}
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
        </article>

        <article className="flex flex-col rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          {readiness.missingUsefulResponses > 0 && showReadinessNote ? (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-[1rem] bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-800">
              <p>No hay suficiente información para entregar el informe aún.</p>
              <button
                type="button"
                onClick={() => setShowReadinessNote(false)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-900"
                aria-label="Cerrar aviso de preparación del informe"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col">
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
                  Abre una vista previa minimalista dentro de la plataforma y
                  desde allí imprime o guarda el informe.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {dashboardData?.period ?? cadenceMeta.periodLabel}
              </span>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white shadow-emerald-900/20 transition hover:bg-emerald-900"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Ver informe
              </button>
            </div>

            <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50/80 p-4">
                <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Periodo del informe
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {dashboardData?.period ?? cadenceMeta.periodLabel}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-4">
                <TrendingUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Estado actual
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {readiness.missingUsefulResponses > 0
                    ? "Se abriría como borrador preliminar."
                    : "Se puede abrir como informe consolidado."}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

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

      <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
                className="rounded-[1.15rem] bg-[#f7f8f4] p-4"
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
          <div className="mt-5 rounded-[1.15rem] bg-white p-6 text-sm leading-6 text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            Aún no hay variaciones suficientemente bruscas para marcar una anomalía
            operativa en este periodo.
          </div>
        )}
      </section>

      {SHOW_AGENT_UI ? (
        <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {agentReportError}
            </div>
          ) : null}

          {agentReport ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.1rem] bg-slate-50/80 p-4">
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
              <div className="rounded-[1.1rem] bg-slate-50/80 p-4">
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

      <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
            {cadenceSettingMeta.periodBadge}
          </span>
        </div>

        {reports.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report.branch}
                className="rounded-[1.15rem] bg-[#f7f8f4] p-4"
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
                      {cadenceMeta.branchReadinessLabel}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {report.readinessPercent}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${cadenceMeta.branchReadinessLabel} de ${report.branch}`}
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
          <div className="mt-5 rounded-[1.15rem] bg-white p-6 text-sm leading-6 text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            Aún no hay valoraciones suficientes para construir patrones por
            establecimiento.
          </div>
        )}
      </section>
    </div>
  );
}

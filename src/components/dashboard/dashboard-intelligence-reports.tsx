"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Mail,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { buildBranchReports, buildReportReadiness } from "@/domain/dashboard/report-readiness";

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

export function DashboardIntelligenceReports({
  dashboardData,
}: {
  dashboardData?: DashboardSummaryData;
}) {
  const comments = dashboardData?.comments ?? [];
  const reports = buildBranchReports(comments);
  const readiness = buildReportReadiness(comments, reports);
  const priorityBranch = reports[0];
  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const riskCount = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const analyzedCount = comments.filter((comment) => comment.analysisModel).length;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
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
              El avance sube cuando entran valoraciones con motivo claro. Las
              respuestas completas cuentan más; las ambiguas suman poco y las
              genéricas no ayudan al informe.
            </p>
          </div>
        </div>
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

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
          <CalendarDays className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            Entrega por defecto
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Semanal los lunes para operación. Mensual el día 15 para gerencia.
          </p>
        </article>
        <article className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
          <TrendingUp className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            Panel interno
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Esta vista será la fuente principal antes de generar PDF o correos.
          </p>
        </article>
        <article className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
          <Mail className="h-5 w-5 text-slate-500" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            Distribución
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            PDF descargable y correo programado quedan como siguiente paso sobre
            este mismo contenido.
          </p>
        </article>
      </section>
    </div>
  );
}

"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Mail,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardCommentRow,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";

type InformationQuality = "suficiente" | "parcial" | "insuficiente";

const MONTHLY_USEFUL_RESPONSES_PER_BRANCH = 8;
const MIN_MONTHLY_USEFUL_RESPONSES = 12;

type BranchReport = {
  branch: string;
  total: number;
  risk: number;
  positive: number;
  neutral: number;
  insufficient: number;
  partial: number;
  sufficient: number;
  usefulResponses: number;
  targetUsefulResponses: number;
  readinessPercent: number;
  topPattern: string;
  recommendedAction: string;
};

function classifyInformationQuality(comment: DashboardCommentRow): InformationQuality {
  if (comment.informationQuality === "sufficient") {
    return "suficiente";
  }

  if (comment.informationQuality === "partial") {
    return "parcial";
  }

  if (comment.informationQuality === "insufficient") {
    return "insuficiente";
  }

  const normalizedMessage = comment.message.toLowerCase();
  const wordCount = normalizedMessage.split(/\s+/).filter(Boolean).length;
  const genericSignals = [
    "hay mucho que mejorar",
    "cosas",
    "algo",
    "varias áreas",
    "varias areas",
    "mejorar",
    "regular",
    "normal",
  ];
  const hasGenericSignal = genericSignals.some((signal) =>
    normalizedMessage.includes(signal),
  );
  const pattern = comment.feedbackType.toLowerCase();
  const genericPattern =
    pattern === "" ||
    pattern.includes("general") ||
    pattern.includes("otro") ||
    pattern.includes("experiencia del cliente");

  if (wordCount < 8 || (hasGenericSignal && genericPattern)) {
    return "insuficiente";
  }

  if (wordCount < 16 || hasGenericSignal || genericPattern) {
    return "parcial";
  }

  return "suficiente";
}

function getMostCommonPattern(comments: DashboardCommentRow[]) {
  const counts = new Map<string, number>();

  for (const comment of comments) {
    const pattern = comment.dominantPattern ?? comment.feedbackType ?? "Experiencia general";
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "Sin patrón suficiente";
}

function buildBranchReports(comments: DashboardCommentRow[]): BranchReport[] {
  const commentsByBranch = new Map<string, DashboardCommentRow[]>();

  for (const comment of comments) {
    const current = commentsByBranch.get(comment.branch) ?? [];
    current.push(comment);
    commentsByBranch.set(comment.branch, current);
  }

  return [...commentsByBranch.entries()]
    .map(([branch, branchComments]) => {
      const qualityCounts = branchComments.reduce(
        (current, comment) => {
          current[classifyInformationQuality(comment)] += 1;
          return current;
        },
        { suficiente: 0, parcial: 0, insuficiente: 0 },
      );
      const risk = branchComments.filter((comment) => comment.sentiment === "Riesgo").length;
      const positive = branchComments.filter(
        (comment) => comment.sentiment === "Positivo",
      ).length;
      const neutral = branchComments.length - risk - positive;
      const usefulResponses = qualityCounts.suficiente + qualityCounts.parcial * 0.5;
      const readinessPercent = Math.min(
        100,
        Math.round((usefulResponses / MONTHLY_USEFUL_RESPONSES_PER_BRANCH) * 100),
      );
      const missingUsefulResponses = Math.max(
        0,
        Math.ceil(MONTHLY_USEFUL_RESPONSES_PER_BRANCH - usefulResponses),
      );
      const recommendedAction =
        missingUsefulResponses > 0
          ? `Faltan ${missingUsefulResponses} valoraciones con motivo claro para un informe mensual más sólido. Pedir motivo principal cuando la valoración sea ambigua.`
          : "Base suficiente para resumir patrones mensuales con mejor confianza.";

      return {
        branch,
        total: branchComments.length,
        risk,
        positive,
        neutral,
        insufficient: qualityCounts.insuficiente,
        partial: qualityCounts.parcial,
        sufficient: qualityCounts.suficiente,
        usefulResponses,
        targetUsefulResponses: MONTHLY_USEFUL_RESPONSES_PER_BRANCH,
        readinessPercent,
        topPattern: getMostCommonPattern(branchComments),
        recommendedAction,
      };
    })
    .sort((left, right) => {
      const qualityDiff =
        right.insufficient + right.partial - (left.insufficient + left.partial);
      if (qualityDiff !== 0) return qualityDiff;
      return right.risk - left.risk;
    });
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

export function DashboardIntelligenceReports({
  dashboardData,
}: {
  dashboardData?: DashboardSummaryData;
}) {
  const comments = dashboardData?.comments ?? [];
  const reports = buildBranchReports(comments);
  const usefulResponses = reports.reduce(
    (sum, report) => sum + report.usefulResponses,
    0,
  );
  const clearResponses = reports.reduce((sum, report) => sum + report.sufficient, 0);
  const targetUsefulResponses = Math.max(
    MIN_MONTHLY_USEFUL_RESPONSES,
    reports.length * MONTHLY_USEFUL_RESPONSES_PER_BRANCH,
  );
  const qualityPercent =
    comments.length > 0 ? Math.round((clearResponses / comments.length) * 100) : 0;
  const volumePercent = Math.min(100, (usefulResponses / targetUsefulResponses) * 100);
  const readinessPercent = Math.min(
    100,
    Math.round(volumePercent * 0.7 + qualityPercent * 0.3),
  );
  const missingUsefulResponses = Math.max(
    0,
    Math.ceil(targetUsefulResponses - usefulResponses),
  );
  const priorityBranch = reports[0];
  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const riskCount = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const analyzedCount = comments.length;

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
              {readinessPercent}% listo
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {missingUsefulResponses > 0
                ? `Faltan ${missingUsefulResponses} valoraciones útiles para explicar mejor los patrones por sucursal.`
                : "La base actual permite preparar un informe mensual con buena claridad."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {usefulResponses.toFixed(1)} / {targetUsefulResponses} respuestas útiles
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {qualityPercent}% claridad
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
                {readinessPercent}%
              </p>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Preparación del informe mensual"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readinessPercent}
            >
              <div
                className="h-full rounded-full bg-slate-700 transition-all"
                style={{ width: `${readinessPercent}%` }}
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
            Esta vista es la fuente principal antes de generar PDF o correos.
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

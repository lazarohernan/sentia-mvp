"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardCommentRow,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";

type InformationQuality = "suficiente" | "parcial" | "insuficiente";

type BranchReport = {
  branch: string;
  total: number;
  risk: number;
  positive: number;
  neutral: number;
  insufficient: number;
  partial: number;
  topPattern: string;
  recommendedAction: string;
};

function classifyInformationQuality(comment: DashboardCommentRow): InformationQuality {
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
  const pattern = comment.dominantPattern?.toLowerCase() ?? "";
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
    const pattern = comment.dominantPattern ?? "Experiencia general";
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
      const topPattern = getMostCommonPattern(branchComments);
      const recommendedAction =
        qualityCounts.insuficiente + qualityCounts.parcial >
        Math.ceil(branchComments.length / 2)
          ? "Mejorar la captura: pedir motivo principal antes de cerrar la valoración."
          : risk > positive
            ? "Revisar casos de riesgo y documentar acciones de seguimiento."
            : "Usar los comentarios positivos para repetir prácticas del equipo.";

      return {
        branch,
        total: branchComments.length,
        risk,
        positive,
        neutral,
        insufficient: qualityCounts.insuficiente,
        partial: qualityCounts.parcial,
        topPattern,
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

function buildExecutiveReading(
  comments: DashboardCommentRow[],
  reports: BranchReport[],
) {
  if (comments.length === 0) {
    return {
      headline: "Aún no hay suficientes valoraciones para generar un informe.",
      detail:
        "Cuando entren comentarios, esta vista separará señales accionables de comentarios que necesitan mejor captura.",
      action: "Mantener activo el enlace QR y revisar la captura al cierre de la semana.",
    };
  }

  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const weakPercent = Math.round((weakDataCount / comments.length) * 100);
  const mainBranch = reports[0];

  return {
    headline:
      weakPercent >= 45
        ? "La plataforma ya detecta señales, pero falta capturar mejor el motivo."
        : "Hay información suficiente para dar seguimiento operativo esta semana.",
    detail: mainBranch
      ? `${mainBranch.branch} concentra la mayor oportunidad: ${mainBranch.total} valoraciones, ${mainBranch.insufficient + mainBranch.partial} con información parcial o insuficiente.`
      : "El periodo actual no muestra una sucursal dominante.",
    action:
      weakPercent >= 45
        ? "Agregar una pregunta de motivo principal cuando el comentario sea ambiguo."
        : "Preparar un informe semanal con patrones, responsables y acciones cerradas.",
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

export function DashboardIntelligenceReports({
  dashboardData,
}: {
  dashboardData?: DashboardSummaryData;
}) {
  const comments = dashboardData?.comments ?? [];
  const reports = buildBranchReports(comments);
  const reading = buildExecutiveReading(comments, reports);
  const weakDataCount = reports.reduce(
    (sum, report) => sum + report.partial + report.insufficient,
    0,
  );
  const riskCount = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const analyzedCount = comments.filter((comment) => comment.analysisModel).length;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FileText className="h-4 w-4 text-amber-700" aria-hidden="true" />
              Informe inteligente
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
              {reading.headline}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {reading.detail}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm leading-6 text-slate-700 lg:max-w-sm">
            <p className="font-semibold text-slate-950">Acción recomendada</p>
            <p className="mt-1">{reading.action}</p>
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

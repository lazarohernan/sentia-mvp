"use client";

import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LineChart,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import {
  buildBranchReports,
  groupCommentsByBranch,
} from "@/domain/dashboard/report-readiness";
import type { DashboardCommentRow, DashboardSummaryData } from "@/domain/dashboard/schemas";

type ImprovementPlan = {
  branch: string;
  summary: string;
  action: string;
  owner: string;
  metric: string;
  timeframe: string;
  successSignal: string;
  evidence: string;
};

function buildImprovementPlan(
  branch: string,
  comments: DashboardCommentRow[],
): ImprovementPlan {
  const reports = buildBranchReports(comments);
  const report = reports.find((item) => item.branch === branch);
  const branchComments = comments.filter((comment) => comment.branch === branch);
  const latestComment = branchComments.find(
    (comment) => Boolean(comment.analysisSummary?.trim()),
  );
  const topPattern = report?.topPattern ?? "Experiencia del cliente";
  const dominantRisk = report?.risk ?? 0;
  const missingContext = (report?.insufficient ?? 0) + (report?.partial ?? 0);
  const summary =
    latestComment?.analysisSummary?.trim() ??
    (dominantRisk > 0
      ? `${branch} está acumulando señales que conviene ordenar y atender con seguimiento consistente.`
      : `${branch} ya tiene base suficiente para convertir comentarios en mejoras puntuales.`);

  let owner = "Líder de sucursal";
  let metric = "CSAT de la sucursal y comentarios del patrón principal";
  let timeframe = "Revisar durante los próximos 14 días";
  let successSignal =
    "Menos comentarios repetidos sobre el mismo motivo y una lectura más clara en las nuevas valoraciones.";
  let action =
    report?.recommendedAction ??
    "Consolidar el patrón principal y definir una acción concreta con responsable.";

  if (missingContext > Math.ceil(branchComments.length / 2)) {
    owner = "Servicio al cliente";
    metric = "Porcentaje de valoraciones útiles y claridad del motivo";
    timeframe = "Corregir captura esta semana y revisar el siguiente corte";
    successSignal =
      "Sube la proporción de comentarios con motivo claro y baja el volumen de respuestas ambiguas.";
    action =
      "Pedir el motivo principal cuando la respuesta sea ambigua y registrar un detalle corto que explique la causa.";
  } else if (dominantRisk > 0) {
    owner = "Gerencia de turno";
    metric = `Comentarios de riesgo sobre ${topPattern.toLowerCase()} y tiempo de resolución`;
    timeframe = "Aplicar ajuste esta semana y medir en 7 a 14 días";
    successSignal =
      "Disminuyen las señales de riesgo, el patrón se repite menos y el seguimiento se cierra más rápido.";
    action =
      latestComment?.recommendedAction?.trim() ??
      `Atender primero el patrón de ${topPattern.toLowerCase()} y documentar la acción correctiva en la misma sucursal.`;
  } else if ((report?.positive ?? 0) >= (report?.risk ?? 0)) {
    owner = "Jefatura de experiencia";
    metric = `CSAT alto y repetición de buenas prácticas en ${topPattern.toLowerCase()}`;
    timeframe = "Replicar durante el próximo ciclo semanal";
    successSignal =
      "Se mantiene el volumen positivo y aparecen más comentarios que describen qué funcionó bien.";
    action =
      latestComment?.recommendedAction?.trim() ??
      `Tomar la práctica que ya funciona en ${topPattern.toLowerCase()} y replicarla en el resto del equipo.`;
  }

  return {
    branch,
    summary,
    action,
    owner,
    metric,
    timeframe,
    successSignal,
    evidence:
      latestComment?.message ??
      `${branchComments.length} valoraciones en el periodo, ${report?.risk ?? 0} de riesgo y patrón dominante ${topPattern.toLowerCase()}.`,
  };
}

function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: ImprovementPlan;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-[1.15rem] border p-4 text-left transition",
        isSelected
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_20px_45px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.12em]",
              isSelected ? "text-slate-300" : "text-slate-400",
            ].join(" ")}
          >
            Sucursal
          </p>
          <h3 className="mt-1 text-base font-semibold">{plan.branch}</h3>
        </div>
        <ArrowRight
          className={isSelected ? "text-white" : "text-slate-400"}
          size={16}
          aria-hidden="true"
        />
      </div>
      <p
        className={[
          "mt-3 text-sm leading-6",
          isSelected ? "text-slate-200" : "text-slate-600",
        ].join(" ")}
      >
        {plan.summary}
      </p>
    </button>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  const Icon = icon;

  return (
    <div className="rounded-[1rem] border border-slate-100 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" size={16} aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

export function DashboardImprovementPlans({
  dashboardData,
}: {
  dashboardData?: DashboardSummaryData;
}) {
  const comments = dashboardData?.comments ?? [];
  const commentsByBranch = groupCommentsByBranch(comments);
  const branchNames = [...commentsByBranch.keys()];
  const [selectedBranch, setSelectedBranch] = useState<string>(branchNames[0] ?? "");

  const plans = branchNames.map((branch) =>
    buildImprovementPlan(branch, commentsByBranch.get(branch) ?? []),
  );
  const activePlan = plans.find((plan) => plan.branch === selectedBranch) ?? plans[0] ?? null;

  if (!activePlan) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-500">
        Aún no hay suficiente base para sugerir un plan de mejora por sucursal.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ClipboardList className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Plan de mejora por sucursal
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
              Acciones operativas sugeridas para el siguiente ciclo
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Esta vista toma los comentarios ya analizados y los convierte en una
              propuesta concreta de acción, responsable, plazo y métrica para cada
              establecimiento.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Base: {dashboardData?.period ?? "Últimos 7 días"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.branch}
              plan={plan}
              isSelected={plan.branch === activePlan.branch}
              onSelect={() => setSelectedBranch(plan.branch)}
            />
          ))}
        </div>

        <article className="rounded-[1.35rem] border border-slate-200 bg-[#f7f8f4] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Lectura del patrón
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                {activePlan.branch}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {activePlan.summary}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Acción prioritaria
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-800">
                {activePlan.action}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            <DetailRow icon={UserRound} label="Responsable" value={activePlan.owner} />
            <DetailRow icon={LineChart} label="Métrica a observar" value={activePlan.metric} />
            <DetailRow icon={CalendarClock} label="Plazo de revisión" value={activePlan.timeframe} />
            <DetailRow
              icon={CheckCircle2}
              label="Señal de éxito"
              value={activePlan.successSignal}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ShieldAlert className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Evidencia base
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {activePlan.evidence}
              </p>
            </div>

            <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Uso sugerido
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Este plan sirve como guía operativa. El siguiente paso natural es
                conectarlo a seguimiento para registrar qué acción sí ejecutó el equipo.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

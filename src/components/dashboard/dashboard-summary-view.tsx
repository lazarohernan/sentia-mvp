import {
  ArrowRight,
  Bell,
  Building2,
  Frown,
  MessageSquareText,
  Meh,
  Smile,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type {
  DashboardBranchHealthItem,
  DashboardFollowUpMetrics,
  DashboardRecentComment,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { DashboardAlertsSummaryPreview } from "./dashboard-alerts-summary-preview";
import {
  CsatHealthDistributionBar,
  CsatHealthExplanation,
  healthZoneStyles,
} from "./csat-health-distribution";
import { HealthDistributionHeading } from "./health-distribution-heading";
import { DashboardSection } from "./dashboard-section";

type DashboardSummaryViewProps = {
  dashboardData?: DashboardSummaryData;
  alerts?: DashboardAlertItem[];
};

type StatusTone = "success" | "warning" | "danger" | "neutral";

const emptySummary = [
  { label: "Comentarios", value: "Sin datos", detail: "" },
  { label: "CSAT", value: "Sin datos", detail: "" },
  { label: "Alertas", value: "Sin datos", detail: "" },
  { label: "Sucursales", value: "Sin datos", detail: "" },
];

const metricIcons: Record<string, LucideIcon> = {
  Comentarios: MessageSquareText,
  CSAT: Star,
  Alertas: Bell,
  Sucursales: Building2,
};

const sentimentIcons: Record<StatusTone, LucideIcon> = {
  success: Smile,
  warning: Meh,
  danger: Frown,
  neutral: Meh,
};

function toneClasses(tone: StatusTone) {
  const tones = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-100",
      icon: "text-emerald-700",
      chip: "bg-emerald-50 text-emerald-800",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-100",
      icon: "text-amber-700",
      chip: "bg-amber-50 text-amber-800",
    },
    danger: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      icon: "text-red-600",
      chip: "bg-red-50 text-red-700",
    },
    neutral: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-100",
      icon: "text-slate-500",
      chip: "bg-slate-100 text-slate-600",
    },
  };

  return tones[tone];
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
  const Icon = metricIcons[label] ?? TrendingUp;
  const hasValue = value !== "Sin datos";

  return (
    <article className="min-h-[132px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <Icon
          size={20}
          className="shrink-0 text-slate-950"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
      <p
        className={
          hasValue
            ? "mt-3 text-4xl font-semibold tracking-normal text-slate-950"
            : "mt-6 text-sm font-medium text-slate-400"
        }
      >
        {value}
      </p>
      {detail ? (
        <p
          className={`mt-2 text-sm font-semibold ${
            label === "Alertas" ? "text-red-600" : "text-emerald-800"
          }`}
        >
          {detail}
        </p>
      ) : null}
    </article>
  );
}

function EmptyOperationalSummary() {
  return (
    <section
      aria-label="Resumen operativo sin datos"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
    >
      <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        <TrendingUp size={14} aria-hidden="true" />
        Resumen operativo sin datos
      </p>
      <h3 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
        Todavía no hay señales suficientes para analizar.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Cuando entren comentarios, CSAT y estados de seguimiento, este bloque
        mostrará prioridades claras para la gerencia.
      </p>
    </section>
  );
}

function SummaryOverviewPanel({
  scope,
  period,
  isBranchView,
  alerts,
  metrics,
}: {
  scope: string;
  period: string;
  isBranchView: boolean;
  alerts: DashboardAlertItem[];
  metrics: DashboardFollowUpMetrics;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-h-0 flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Alcance del resumen
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              {isBranchView ? "Operación de punto de venta" : "Operación completa"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isBranchView
                ? "Indicadores y alertas de la sucursal seleccionada o asignada."
                : "Indicadores y alertas de todas las sucursales disponibles para tu usuario."}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-[#f7f8f4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Cobertura
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{scope}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-[#f7f8f4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Periodo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{period}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 border-t border-slate-100 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <DashboardAlertsSummaryPreview alerts={alerts} metrics={metrics} />
        </div>
      </div>
    </section>
  );
}

function BranchHealth({ items }: { items: DashboardBranchHealthItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">
          Salud de sucursales
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Hasta 3 sucursales con mayor prioridad de revisión en este periodo.
        </p>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {items.map((branch) => {
          const classes = toneClasses(branch.tone);
          const healthKey =
            branch.tone === "success"
              ? "good"
              : branch.tone === "warning"
                ? "observation"
                : branch.tone === "danger"
                  ? "risk"
                  : "none";
          const healthStyle = healthZoneStyles[healthKey];

          return (
            <article
              key={branch.branch}
              className="grid gap-4 py-4 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,15rem)] lg:items-stretch"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {branch.branch}
                  </p>
                  {branch.scoredCount > 0 ? (
                    <p
                      className={`mt-2 inline-flex items-baseline gap-0.5 rounded-lg px-2 py-1 text-lg font-bold leading-none ${healthStyle.badgeClassName}`}
                    >
                      {branch.csat}
                      <span className="text-xs font-semibold opacity-80">/5</span>
                    </p>
                  ) : null}
                  <p className={`mt-2 text-sm font-semibold ${classes.text}`}>
                    {branch.status}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{branch.comments}</p>
                </div>
                <Store
                  size={20}
                  className="shrink-0 text-slate-950"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 space-y-2 lg:px-2">
                <HealthDistributionHeading />
                <CsatHealthDistributionBar
                  zonePercents={branch.zonePercents}
                  zoneCounts={branch.zoneCounts}
                  showExplanation={false}
                  size="compact"
                />
              </div>

              <div className="min-w-0 lg:border-l lg:border-slate-100 lg:pl-4">
                <CsatHealthExplanation
                  zoneCounts={branch.zoneCounts}
                  zonePercents={branch.zonePercents}
                  scoredCount={branch.scoredCount}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RecentComments({ comments }: { comments: DashboardRecentComment[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="p-5 pb-0">
        <h3 className="text-lg font-semibold text-slate-950">
          Comentarios recientes
        </h3>
      </div>
      <div className="mt-4 overflow-x-auto px-5">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-3 pr-4">Sucursal</th>
              <th className="py-3 pr-4">Comentario</th>
              <th className="py-3 pr-4">Sentimiento</th>
              <th className="py-3 pr-4">CSAT</th>
              <th className="py-3 pr-4">Estado</th>
              <th className="py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comments.map((comment) => {
              const classes = toneClasses(comment.tone);
              const SentimentIcon = sentimentIcons[comment.tone];

              return (
                <tr key={`${comment.branch}-${comment.date}`}>
                  <td className="py-3 pr-4 font-medium text-slate-700">
                    {comment.branch}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {comment.comment}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full ${classes.bg} ${classes.icon}`}
                      aria-label={comment.sentiment}
                    >
                      <SentimentIcon size={17} aria-hidden="true" />
                    </span>
                  </td>
                  <td className={`py-3 pr-4 font-semibold ${classes.text}`}>
                    {comment.csat}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${classes.chip}`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{comment.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <a
        href="/dashboard#comentarios"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 border-t border-slate-100 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50/60"
      >
        Ver detalle de comentarios
        <ArrowRight size={16} aria-hidden="true" />
      </a>
    </section>
  );
}

export function DashboardSummaryView({
  dashboardData,
  alerts = [],
}: DashboardSummaryViewProps) {
  const summary = dashboardData?.metrics ?? emptySummary;
  const branchHealthItems = dashboardData?.branchHealth ?? [];
  const recentCommentItems = dashboardData?.recentComments ?? [];
  const followUpMetrics = dashboardData?.followUpMetrics ?? {
    openCount: 0,
    escalatedCount: 0,
    inReviewCount: 0,
    resolvedCount: 0,
    avgResponseHours: null,
    avgResolutionHours: null,
  };
  const scope = dashboardData?.scope ?? "Sin alcance";
  const period = dashboardData?.period ?? "Sin periodo";
  const isBranchView = scope === "1 sucursal";
  const hasOperationalData =
    branchHealthItems.length > 0 ||
    recentCommentItems.length > 0 ||
    alerts.length > 0;

  return (
    <DashboardSection
      id="resumen"
      title="Resumen"
      description="Indicadores principales para decidir dónde revisar primero."
    >
      <div className="space-y-3.5">
        <SummaryOverviewPanel
          scope={scope}
          period={period}
          isBranchView={isBranchView}
          alerts={alerts}
          metrics={followUpMetrics}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
            />
          ))}
        </div>

        {hasOperationalData ? (
          <>
            {branchHealthItems.length > 0 ? (
              <BranchHealth items={branchHealthItems} />
            ) : null}
            <div className="grid gap-4">
              {recentCommentItems.length > 0 ? (
                <RecentComments comments={recentCommentItems} />
              ) : null}
            </div>
          </>
        ) : (
          <EmptyOperationalSummary />
        )}

      </div>
    </DashboardSection>
  );
}

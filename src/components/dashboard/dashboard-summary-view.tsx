import { ArrowRight, Frown, Meh, Smile } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type {
  DashboardBranchHealthItem,
  DashboardFollowUpMetrics,
  DashboardRecentComment,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { DashboardAlertsSummaryPreview } from "./dashboard-alerts-summary-preview";
import {
  CsatHealthDistributionBar,
  CsatHealthZoneLegend,
} from "./csat-health-distribution";
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

function MetricStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  const hasValue = value !== "Sin datos";
  const detailTone =
    label === "Alertas" ? "text-signal-danger-ink" : "text-brand-muted";

  return (
    <article className="min-w-0 px-0 py-1 md:px-5 md:first:pl-0 md:last:pr-0">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p
        className={
          hasValue
            ? "mt-2 min-w-0 wrap-anywhere text-4xl font-semibold tracking-normal text-text-primary"
            : "mt-3 text-sm font-medium text-text-secondary"
        }
      >
        {value}
      </p>
      {detail ? (
        <p className={`mt-2 text-sm font-medium ${detailTone}`}>{detail}</p>
      ) : null}
    </article>
  );
}

function EmptyOperationalSummary() {
  return (
    <section
      aria-label="Resumen operativo sin datos"
      className="rounded-2xl bg-white p-6 "
    >
      <p className="text-xs font-semibold text-text-secondary">
        Resumen operativo sin datos
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-normal text-text-primary">
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
    <section className="overflow-hidden rounded-2xl bg-white ">
      <div className="grid lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-h-0 flex-col justify-between p-5">
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
            <div className="rounded-xl bg-[#f7f8f4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Cobertura
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{scope}</p>
            </div>
            <div className="rounded-xl bg-[#f7f8f4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Periodo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{period}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 bg-brand-muted p-5">
          <DashboardAlertsSummaryPreview alerts={alerts} metrics={metrics} />
        </div>
      </div>
    </section>
  );
}

function branchToneClass(tone: DashboardBranchHealthItem["tone"]) {
  if (tone === "danger") return "text-signal-danger-ink";
  if (tone === "warning") return "text-signal-warning-ink";
  if (tone === "success") return "text-signal-ok-ink";
  return "text-text-secondary";
}

function branchDecisionLine(branch: DashboardBranchHealthItem) {
  if (branch.scoredCount === 0) {
    return "Sin calificación en este periodo";
  }

  if (branch.zoneCounts.risk > 0) {
    return branch.zoneCounts.risk === 1
      ? "1 valoración en riesgo"
      : `${branch.zoneCounts.risk} valoraciones en riesgo`;
  }

  if (branch.zoneCounts.observation > 0) {
    return branch.zoneCounts.observation === 1
      ? "1 experiencia regular"
      : `${branch.zoneCounts.observation} con experiencia regular`;
  }

  return "Buena experiencia en este periodo";
}

function buildBranchCommentsHref(
  dateRange: DashboardDateRange | undefined,
  branchId?: string,
) {
  const params = new URLSearchParams();

  if (dateRange) {
    params.set("period", dateRange.period);
    if (dateRange.period === "custom") {
      params.set("start", dateRange.startDate);
      params.set("end", dateRange.endDate);
    }
  }

  if (branchId) {
    params.set("branchId", branchId);
  }

  const query = params.toString();
  return query ? `/dashboard?${query}#comentarios` : "/dashboard#comentarios";
}

function BranchHealth({
  items,
  dateRange,
}: {
  items: DashboardBranchHealthItem[];
  dateRange?: DashboardDateRange;
}) {
  return (
    <section
      aria-label="Salud de sucursales"
      className="rounded-2xl bg-surface p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-text-primary">
            Salud de sucursales
          </h3>
          <p className="mt-1 text-sm leading-5 text-text-secondary">
            Nota promedio y cómo se repartieron las calificaciones.
          </p>
        </div>
        <CsatHealthZoneLegend />
      </div>

      <div className="mt-4 divide-y divide-border-soft">
        {items.map((branch) => {
          const volumeLabel =
            branch.scoredCount === 0
              ? branch.comments
              : branch.scoredCount === 1
                ? "1 valoración"
                : `${branch.scoredCount} valoraciones`;

          return (
            <article
              key={branch.branchId ?? branch.branch}
              className="grid gap-4 py-4 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <p className="min-w-0 wrap-anywhere text-sm font-semibold text-text-primary">
                  {branch.branch}
                </p>
                {branch.scoredCount > 0 ? (
                  <p
                    className={`mt-2 min-w-0 text-2xl font-semibold leading-none ${branchToneClass(branch.tone)}`}
                  >
                    {branch.csat}
                    <span className="ml-1 text-sm font-medium text-text-secondary">
                      /5
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-medium text-text-secondary">
                    Sin nota
                  </p>
                )}
                <p className="mt-2 text-sm text-text-secondary">{volumeLabel}</p>
                <p className={`mt-1 text-sm ${branchToneClass(branch.tone)}`}>
                  {branchDecisionLine(branch)}
                </p>
              </div>

              <div className="min-w-0">
                <CsatHealthDistributionBar
                  zonePercents={branch.zonePercents}
                  zoneCounts={branch.zoneCounts}
                  showExplanation={false}
                  size="row"
                />
              </div>

              <Link
                href={buildBranchCommentsHref(dateRange, branch.branchId)}
                className="inline-flex h-9 shrink-0 items-center text-sm font-semibold text-brand-muted transition hover:text-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
              >
                Ver valoraciones
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function recentCommentStatusClass(
  status: DashboardRecentComment["status"],
) {
  if (status === "Pendiente") return "text-amber-700";
  if (status === "En revisión") return "text-sky-700";
  if (status === "Resuelto") return "text-emerald-700";
  return "text-slate-600";
}

function RecentComments({ comments }: { comments: DashboardRecentComment[] }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ">
      <div className="p-5 pb-0">
        <h3 className="text-lg font-semibold text-slate-950">
          Comentarios recientes
        </h3>
      </div>
      <div className="mt-4 overflow-x-auto px-5">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            <tr className="border-y border-slate-100">
              <th className="border-r border-slate-100/80 py-3 pr-4 pl-0 font-semibold">
                Sucursal
              </th>
              <th className="border-r border-slate-100/80 px-3 py-3 font-semibold">
                Comentario
              </th>
              <th className="border-r border-slate-100/80 px-3 py-3 font-semibold">
                Sentimiento
              </th>
              <th className="border-r border-slate-100/80 px-3 py-3 font-semibold">
                CSAT
              </th>
              <th className="border-r border-slate-100/80 px-3 py-3 font-semibold">
                Estado
              </th>
              <th className="py-3 pl-3 pr-0 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => {
              const classes = toneClasses(comment.tone);
              const SentimentIcon = sentimentIcons[comment.tone];

              return (
                <tr
                  key={`${comment.branch}-${comment.date}`}
                  className="border-b border-slate-100"
                >
                  <td className="border-r border-slate-100/80 py-3 pr-4 pl-0 font-medium text-slate-700">
                    {comment.branch}
                  </td>
                  <td className="border-r border-slate-100/80 px-3 py-3 text-slate-600">
                    {comment.comment}
                  </td>
                  <td className="border-r border-slate-100/80 px-3 py-3">
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full ${classes.bg} ${classes.icon}`}
                      aria-label={comment.sentiment}
                    >
                      <SentimentIcon size={17} aria-hidden="true" />
                    </span>
                  </td>
                  <td
                    className={`border-r border-slate-100/80 px-3 py-3 font-semibold ${classes.text}`}
                  >
                    {comment.csat}
                  </td>
                  <td className="border-r border-slate-100/80 px-3 py-3">
                    <span
                      className={`text-xs font-semibold ${recentCommentStatusClass(comment.status)}`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td className="py-3 pl-3 pr-0 text-slate-500">
                    {comment.date}
                  </td>
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
    slaBreachedCount: 0,
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
      <div className="space-y-3.5">
        <SummaryOverviewPanel
          scope={scope}
          period={period}
          isBranchView={isBranchView}
          alerts={alerts}
          metrics={followUpMetrics}
        />
        <section
          aria-label="Indicadores del periodo"
          className="grid gap-5 border-y border-border-soft py-5 md:grid-cols-2 md:gap-y-6 xl:grid-cols-4 xl:divide-x xl:divide-border-soft"
        >
          {summary.map((item) => (
            <MetricStat
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
            />
          ))}
        </section>

        {hasOperationalData ? (
          <>
            {branchHealthItems.length > 0 ? (
              <BranchHealth
                items={branchHealthItems}
                dateRange={dashboardData?.dateRange}
              />
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
  );
}

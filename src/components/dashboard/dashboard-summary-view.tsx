import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Frown,
  MessageSquareText,
  Meh,
  Smile,
  Star,
  Store,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  DashboardAttentionItem,
  DashboardBranchHealthItem,
  DashboardInsight,
  DashboardRecentComment,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import {
  dashboardMockAiInsight,
  dashboardMockSummary,
} from "./dashboard.mock-data";
import { DashboardSection } from "./dashboard-section";

type DashboardSummaryViewProps = {
  showDemoData: boolean;
  dashboardData?: DashboardSummaryData;
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

const metricSparklines: Record<string, number[]> = {
  Comentarios: [14, 20, 18, 34, 30, 31, 16, 10, 24, 22, 30],
  CSAT: [18, 16, 20, 34, 26, 27, 18, 15, 34, 29, 30],
  Alertas: [34, 28, 26, 14, 22, 21, 24, 18, 19, 32],
  Sucursales: [16, 20, 24, 26, 34, 36, 27, 22, 33, 24, 35],
};

const actionQueue: DashboardAttentionItem[] = [
  {
    priority: "Prioridad alta",
    title: "Mall Norte - Tiempo de espera alto",
    description: "Asignar a gerencia de turno",
    owner: "Operaciones",
    age: "2h",
    status: "Pendiente",
    tone: "danger" as const,
  },
  {
    priority: "Prioridad media",
    title: "Boulevard - Explicación al cliente",
    description: "Revisar guion del personal",
    owner: "Experiencia",
    age: "4h",
    status: "En revisión",
    tone: "warning" as const,
  },
  {
    priority: "Prioridad baja",
    title: "Centro - Felicitaciones destacadas",
    description: "Compartir feedback positivo",
    owner: "Marketing",
    age: "1d",
    status: "Pendiente",
    tone: "success" as const,
  },
];

const branchHealth: DashboardBranchHealthItem[] = [
  {
    branch: "Centro",
    status: "Estable",
    csat: "4.5",
    comments: "72 comentarios",
    tone: "success" as const,
    marker: 76,
    segments: [58, 20, 22],
  },
  {
    branch: "Mall Norte",
    status: "Riesgo",
    csat: "2.8",
    comments: "189 comentarios",
    tone: "danger" as const,
    marker: 22,
    segments: [22, 22, 56],
  },
  {
    branch: "Boulevard",
    status: "Observación",
    csat: "3.6",
    comments: "96 comentarios",
    tone: "warning" as const,
    marker: 54,
    segments: [42, 36, 22],
  },
];

const recentComments: DashboardRecentComment[] = [
  {
    id: "demo-recent-1",
    branch: "Mall Norte",
    comment: "La espera fue demasiado larga...",
    sentiment: "Riesgo",
    csat: "1/5",
    status: "Pendiente",
    date: "Hoy, 10:32",
    tone: "danger" as const,
  },
  {
    id: "demo-recent-2",
    branch: "Boulevard",
    comment: "El personal no explicó bien...",
    sentiment: "Neutral",
    csat: "2/5",
    status: "En revisión",
    date: "Hoy, 09:58",
    tone: "warning" as const,
  },
  {
    id: "demo-recent-3",
    branch: "Centro",
    comment: "Excelente atención, muy amables.",
    sentiment: "Positivo",
    csat: "5/5",
    status: "Resuelto",
    date: "Hoy, 09:41",
    tone: "success" as const,
  },
  {
    id: "demo-recent-4",
    branch: "Centro",
    comment: "Me ayudaron rápido y resolvieron.",
    sentiment: "Positivo",
    csat: "4/5",
    status: "Resuelto",
    date: "Ayer, 18:21",
    tone: "success" as const,
  },
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

function Sparkline({ points, tone }: { points: number[]; tone: StatusTone }) {
  const color =
    tone === "danger" ? "#ef4444" : tone === "warning" ? "#f59e0b" : "#10b981";
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 112;
      const y = 42 - ((point - min) / Math.max(max - min, 1)) * 34;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className="h-12 w-28"
      viewBox="0 0 112 48"
      role="img"
      aria-label="Tendencia"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  detail,
  showDemoData,
}: {
  label: string;
  value: string;
  detail: string;
  showDemoData: boolean;
}) {
  const Icon = metricIcons[label] ?? TrendingUp;
  const tone = label === "Alertas" ? "danger" : "success";
  const classes = toneClasses(tone);
  const hasValue = value !== "Sin datos";

  return (
    <article className="min-h-[132px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${classes.bg} ${classes.icon}`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
        </div>
        {showDemoData || (hasValue && detail) ? (
          <Sparkline
            points={metricSparklines[label] ?? metricSparklines.Comentarios}
            tone={tone}
          />
        ) : null}
      </div>
      <p
        className={
          showDemoData
            ? "mt-3 text-4xl font-semibold tracking-normal text-slate-950"
            : hasValue
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
      aria-label="Insights IA"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
    >
      <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        <TrendingUp size={14} aria-hidden="true" />
        Insights IA sin datos
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

function PriorityInsight({ insight }: { insight: DashboardInsight }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white">
          <TrendingUp size={14} aria-hidden="true" />
          {insight.status}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} aria-hidden="true" />
          {insight.confidence}
        </span>
      </div>

      <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1fr_230px]">
        <div className="flex flex-col">
          <div className="flex gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={27} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[1.35rem] font-semibold leading-tight tracking-normal text-slate-950">
                {insight.headline}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {insight.detail}
              </p>
            </div>
          </div>

          <div className="mt-auto grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Clock3 size={17} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Patrón dominante
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {insight.dominantPattern}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {insight.dominantPatternDetail}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <ArrowRight size={17} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Acción sugerida
                </p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-emerald-800">
                  {insight.action}
                  <ArrowRight size={16} aria-hidden="true" />
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {insight.actionDetail}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#f7f8f4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Por qué es prioridad
          </p>
          <div className="mt-3 space-y-3">
            {insight.reasonMetrics.map(({ value, label }, index) => {
              const Icon = [Bell, Star, Clock3][index] ?? Bell;

              return (
              <div key={`${value}-${label}`} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {value}
                  </p>
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">
                    {label}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function AttentionQueue({ items }: { items: DashboardAttentionItem[] }) {
  return (
    <aside className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">
          Hoy requiere atención
        </h3>
        <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {items.length}
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => {
          const classes = toneClasses(item.tone);

          return (
            <article
              key={item.title}
              className={`rounded-xl border ${classes.border} p-2.5`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${classes.chip}`}
                >
                  {item.priority}
                </span>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${classes.chip}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">
                {item.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={13} aria-hidden="true" />
                  {item.owner}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {item.age}
                  <Clock3 size={13} aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
      >
        Ver todas las alertas
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}

function BranchHealth({ items }: { items: DashboardBranchHealthItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">
          Salud de sucursales
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
        >
          Ver todas
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {items.map((branch) => {
          const classes = toneClasses(branch.tone);

          return (
            <article
              key={branch.branch}
              className="grid gap-3 py-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${classes.bg} ${classes.icon}`}
                >
                  <Store size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {branch.branch}
                  </p>
                  <p className="text-sm text-slate-500">{branch.status}</p>
                </div>
              </div>
              <div>
                <div className="relative flex h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="bg-emerald-500"
                    style={{ width: `${branch.segments[0]}%` }}
                  />
                  <span
                    className="bg-amber-400"
                    style={{ width: `${branch.segments[1]}%` }}
                  />
                  <span
                    className="bg-red-500"
                    style={{ width: `${branch.segments[2]}%` }}
                  />
                  <span
                    className="absolute top-[-3px] h-4 w-0.5 rounded-full bg-slate-950"
                    style={{ left: `${branch.marker}%` }}
                  />
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className={`text-sm font-semibold ${classes.text}`}>
                  CSAT {branch.csat}
                </p>
                <p className="text-xs text-slate-500">{branch.comments}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          Bueno 4.0 - 5.0
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-amber-400" />
          Observación 3.0 - 3.9
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-red-500" />
          Riesgo 1.0 - 2.9
        </span>
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
          <thead className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
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
      <button
        type="button"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 border-t border-slate-100 text-sm font-semibold text-emerald-800"
      >
        Ver detalle de comentarios
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}

export function DashboardSummaryView({
  showDemoData,
  dashboardData,
}: DashboardSummaryViewProps) {
  const demoInsight: DashboardInsight = {
    status: dashboardMockAiInsight.status,
    confidence: dashboardMockAiInsight.confidence,
    headline: "Mall Norte necesita revisión operativa hoy",
    detail:
      "La IA cruza comentarios, CSAT y estados abiertos. El patrón más claro apunta a espera prolongada y poca explicación al cliente durante el servicio.",
    action: "Asignar a gerencia de turno",
    dominantPattern: "Tiempo de espera",
    dominantPatternDetail: "Tema repetido en comentarios recientes",
    actionDetail: "Revisar tiempos pico y redistribuir personal",
    reasonMetrics: [
      { value: "42%", label: "Aumento de menciones de espera" },
      { value: "2.8/5", label: "CSAT en Mall Norte" },
      { value: "+12 min", label: "Tiempo promedio de espera reportado" },
    ],
  };
  const summary = showDemoData
    ? dashboardMockSummary
    : dashboardData?.metrics ?? emptySummary;
  const insight = showDemoData ? demoInsight : dashboardData?.insight;
  const attentionItems = showDemoData
    ? actionQueue
    : dashboardData?.attentionItems ?? [];
  const branchHealthItems = showDemoData
    ? branchHealth
    : dashboardData?.branchHealth ?? [];
  const recentCommentItems = showDemoData
    ? recentComments
    : dashboardData?.recentComments ?? [];
  const hasOperationalData =
    Boolean(insight) ||
    attentionItems.length > 0 ||
    branchHealthItems.length > 0 ||
    recentCommentItems.length > 0;

  return (
    <DashboardSection
      id="resumen"
      title="Resumen"
      description="Indicadores principales e insights IA para decidir dónde revisar primero."
    >
      <div className="space-y-3.5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
              showDemoData={showDemoData}
            />
          ))}
        </div>

        {hasOperationalData && insight ? (
          <>
            <div className="grid items-stretch gap-4 xl:grid-cols-[1fr_0.42fr]">
              <PriorityInsight insight={insight} />
              <AttentionQueue items={attentionItems} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {branchHealthItems.length > 0 ? (
                <BranchHealth items={branchHealthItems} />
              ) : null}
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

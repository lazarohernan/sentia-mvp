"use client";

import {
  Angry,
  ArrowLeft,
  Clock3,
  ClipboardCheck,
  Eye,
  Frown,
  Laugh,
  MapPin,
  Meh,
  MessageSquareText,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { FeedbackFollowUpAction } from "@/domain/feedback/follow-up-schemas";
import {
  isWorkflowStatus,
  labelToWorkflowStatus,
  workflowStatusToLabel,
} from "@/domain/feedback/workflow-status";

import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import { computeRatingsHealth } from "@/domain/dashboard/ratings-health";
import {
  CsatHealthDistributionBar,
  CsatHealthExplanation,
  healthZoneStyles,
} from "./csat-health-distribution";
import { HealthDistributionHeading } from "./health-distribution-heading";
import type {
  DashboardCommentRow,
  DashboardFeedbackType,
} from "@/domain/dashboard/schemas";
import { DashboardDataTable } from "./dashboard-data-table";
import type { DashboardDataTableColumn } from "./dashboard-data-table";
import { DashboardDateFilter } from "./dashboard-date-filter";
import {
  DashboardValoracionesTabs,
  type ValoracionesTab,
} from "./dashboard-valoraciones-tabs";

type DashboardComment = DashboardCommentRow;
type CommentStatus =
  | "Nuevo"
  | "En revisión"
  | "En proceso"
  | "Resuelto"
  | "Escalado";

type DashboardCommentsTableProps = {
  comments?: DashboardComment[];
  dateRange?: DashboardDateRange;
  canManageFollowUp?: boolean;
  initialSelectedCommentId?: string | null;
  onCloseDetail?: () => void;
  onCommentUpdated?: (commentId: string, status: CommentStatus) => void;
};

const commentStatuses: CommentStatus[] = [
  "Nuevo",
  "En revisión",
  "En proceso",
  "Resuelto",
  "Escalado",
];

const sentimentStyles: Record<string, string> = {
  Positivo: "bg-emerald-50 text-emerald-800",
  Neutral: "bg-slate-100 text-slate-600",
  Riesgo: "bg-rose-50 text-rose-700",
};

const feedbackTypeOrder: DashboardFeedbackType[] = [
  "Queja",
  "Observación",
  "Felicitación",
  "Recomendación",
];

const feedbackTypeStyles: Record<
  DashboardFeedbackType,
  {
    icon: LucideIcon;
    className: string;
    softClassName: string;
    description: string;
  }
> = {
  Opinión: {
    icon: MessageSquareText,
    className: "bg-slate-100 text-slate-700",
    softClassName: "bg-slate-50 text-slate-600",
    description: "Entrada general recibida por el canal de feedback.",
  },
  Queja: {
    icon: Frown,
    className: "bg-rose-50 text-rose-700",
    softClassName: "bg-rose-50 text-rose-700",
    description: "Molestia o fricción que requiere seguimiento.",
  },
  Observación: {
    icon: ClipboardCheck,
    className: "bg-amber-50 text-amber-800",
    softClassName: "bg-amber-50 text-amber-800",
    description: "Comentario útil para detectar mejora operativa.",
  },
  Felicitación: {
    icon: Smile,
    className: "bg-emerald-50 text-emerald-800",
    softClassName: "bg-emerald-50 text-emerald-800",
    description: "Reconocimiento positivo del cliente.",
  },
  Recomendación: {
    icon: MessageSquareText,
    className: "bg-slate-100 text-slate-600",
    softClassName: "bg-slate-50 text-slate-600",
    description: "Idea o sugerencia para fortalecer la experiencia.",
  },
};

const statusStyles: Record<CommentStatus, string> = {
  Nuevo: "bg-slate-100 text-slate-700",
  "En revisión": "bg-amber-50 text-amber-800",
  "En proceso": "bg-sky-50 text-sky-800",
  Resuelto: "bg-emerald-50 text-emerald-800",
  Escalado: "bg-rose-50 text-rose-700",
};

const statusDescriptions: Record<CommentStatus, string> = {
  Nuevo: "Entrada recibida, pendiente de revisión.",
  "En revisión": "El equipo ya está revisando el caso.",
  "En proceso": "Se está aplicando una acción correctiva.",
  Resuelto: "El seguimiento fue cerrado.",
  Escalado: "Necesita atención de un responsable superior.",
};

const csatStyles: Record<
  number,
  {
    icon: LucideIcon;
    className: string;
    detailClassName: string;
    label: string;
    meaning: string;
    action: string;
  }
> = {
  1: {
    icon: Angry,
    className: "bg-rose-50 text-rose-700",
    detailClassName: "border-rose-200 bg-rose-50 text-rose-700",
    label: "Muy mal",
    meaning: "Experiencia critica o muy frustrante.",
    action: "Requiere seguimiento rapido del encargado.",
  },
  2: {
    icon: Frown,
    className: "bg-orange-50 text-orange-700",
    detailClassName: "border-orange-200 bg-orange-50 text-orange-700",
    label: "Mal",
    meaning: "Hay una molestia clara en la experiencia.",
    action: "Conviene revisar el punto de friccion.",
  },
  3: {
    icon: Meh,
    className: "bg-slate-100 text-slate-600",
    detailClassName: "border-slate-200 bg-slate-50 text-slate-600",
    label: "Normal",
    meaning: "La experiencia cumplio, pero no genero preferencia.",
    action: "Buscar oportunidades simples de mejora.",
  },
  4: {
    icon: Smile,
    className: "bg-emerald-50 text-emerald-700",
    detailClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Bien",
    meaning: "La experiencia fue positiva.",
    action: "Identificar que funciono para repetirlo.",
  },
  5: {
    icon: Laugh,
    className: "bg-emerald-100 text-emerald-900",
    detailClassName: "border-emerald-300 bg-emerald-100 text-emerald-900",
    label: "Excelente",
    meaning: "Experiencia altamente satisfactoria.",
    action: "Puede usarse como senal de buenas practicas.",
  },
};

function normalizeCommentStatus(status: string): CommentStatus {
  if (status === "En revision" || status === "En revisión") {
    return "En revisión";
  }

  if (
    status === "Resuelto" ||
    status === "Escalado" ||
    status === "Nuevo" ||
    status === "En proceso"
  ) {
    return status;
  }

  return "Nuevo";
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeCommentStatus(status);

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[normalizedStatus],
      ].join(" ")}
    >
      {normalizedStatus}
    </span>
  );
}

function FeedbackTypeBadge({ type }: { type: DashboardFeedbackType }) {
  const style = feedbackTypeStyles[type] ?? feedbackTypeStyles.Opinión;
  const Icon = style.icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        style.className,
      ].join(" ")}
    >
      <Icon size={14} aria-hidden="true" />
      {type}
    </span>
  );
}

function CsatBadge({ score }: { score: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = useId();
  const style = csatStyles[score] ?? csatStyles[3];
  const Icon = style.icon;
  const levels = Object.entries(csatStyles).map(([value, level]) => ({
    score: Number(value),
    ...level,
  }));

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className={[
          "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-100",
          style.className,
        ].join(" ")}
        aria-label={`CSAT ${score} de 5, ${style.label}. Ver escala completa`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
      >
        <Icon size={15} aria-hidden="true" />
        {score}/5
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Cerrar detalle CSAT"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            id={popoverId}
            role="dialog"
            aria-label={`Detalle CSAT ${score} de 5`}
            className="fixed left-1/2 top-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Escala CSAT
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {style.label} · {score}/5
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                }}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                aria-label="Cerrar"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {levels.map((level) => {
                const LevelIcon = level.icon;
                const isSelected = level.score === score;

                return (
                  <div
                    key={level.score}
                    className={[
                      "flex min-h-16 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition",
                      isSelected
                        ? `${level.detailClassName} shadow-sm`
                        : "border-slate-100 bg-slate-50 text-slate-400",
                    ].join(" ")}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <LevelIcon size={21} aria-hidden="true" />
                    <span className="mt-1 text-xs font-bold">
                      {level.score}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-[#f7f8f4] p-3">
              <p className="text-sm font-semibold text-slate-800">
                {style.meaning}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {style.action}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CsatScaleStrip({ score }: { score: number }) {
  const levels = Object.entries(csatStyles).map(([value, level]) => ({
    score: Number(value),
    ...level,
  }));
  const selectedStyle = csatStyles[score] ?? csatStyles[3];

  return (
    <div className="mt-5 rounded-[1.25rem] border border-slate-100 bg-[#f7f8f4] p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Calificación CSAT
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {selectedStyle.label} · {score}/5
          </p>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          {selectedStyle.meaning}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {levels.map((level) => {
          const LevelIcon = level.icon;
          const isSelected = level.score === score;

          return (
            <div
              key={level.score}
              className={[
                "flex min-h-20 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition",
                isSelected
                  ? `${level.detailClassName} shadow-sm`
                  : "border-white bg-white text-slate-400",
              ].join(" ")}
              aria-current={isSelected ? "true" : undefined}
            >
              <LevelIcon size={24} aria-hidden="true" />
              <span className="mt-2 text-xs font-bold">{level.score}</span>
              <span className="mt-0.5 max-w-full text-[0.68rem] font-semibold leading-4">
                {level.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useValoracionesMetrics(comments: DashboardComment[]) {
  const scores = comments
    .map((comment) => comment.csatScore)
    .filter((score): score is number => typeof score === "number");
  const metrics = computeRatingsHealth({
    scores,
    totalCount: comments.length,
  });
  const healthKey = metrics.zone === "none" ? "none" : metrics.zone;
  const healthStyle = healthZoneStyles[healthKey];
  const formattedAverage =
    metrics.averageCsat === null ? "—" : metrics.averageCsat.toFixed(1);
  const typeCounts = feedbackTypeOrder.map((type) => ({
    type,
    count: comments.filter((comment) => comment.feedbackType === type).length,
    ...feedbackTypeStyles[type],
  }));

  return { metrics, healthStyle, formattedAverage, typeCounts };
}

function RatingsStatCards({ comments }: { comments: DashboardComment[] }) {
  const { typeCounts } = useValoracionesMetrics(comments);

  return (
    <section className="space-y-4" aria-label="Resumen por tipo de valoración">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Opiniones
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {comments.length}
              </p>
            </div>
            <MessageSquareText
              size={20}
              className="shrink-0 text-slate-950"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Total recibido en el periodo.
          </p>
        </div>

        {typeCounts.map((type) => {
          const Icon = type.icon;

          return (
            <div
              key={type.type}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {type.type}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    {type.count}
                  </p>
                </div>
                <Icon
                  size={20}
                  className="shrink-0 text-slate-950"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {type.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RatingsChartsPanel({ comments }: { comments: DashboardComment[] }) {
  const { metrics, healthStyle, formattedAverage } =
    useValoracionesMetrics(comments);
  const emptyZones = {
    risk: 0,
    observation: 0,
    good: 0,
  } as const;
  const zonePercents =
    metrics.scoredCount > 0 ? metrics.zonePercents : emptyZones;
  const zoneCounts =
    metrics.scoredCount > 0 ? metrics.zoneCounts : emptyZones;

  return (
    <section
      aria-label="Gráficos de valoraciones"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:divide-x lg:divide-slate-100">
        {/* Gráfica principal */}
        <div className="flex min-h-88 flex-col px-5 py-5 sm:min-h-104 sm:px-7 sm:py-7">
          <header className="mb-5 shrink-0 border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Distribución del periodo
            </p>
            <div className="mt-2">
              <HealthDistributionHeading titleClassName="text-lg font-semibold tracking-normal text-slate-950" />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col justify-end">
            {metrics.scoredCount > 0 ? (
              <CsatHealthDistributionBar
                zonePercents={zonePercents}
                zoneCounts={zoneCounts}
                showExplanation={false}
                size="wide"
              />
            ) : (
              <div className="flex flex-1 flex-col justify-center">
                <CsatHealthDistributionBar
                  zonePercents={zonePercents}
                  zoneCounts={zoneCounts}
                  showExplanation={false}
                  size="wide"
                />
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
                  Cuando lleguen valoraciones con nota, verás cuántas experiencias
                  fueron críticas, regulares o positivas.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Métricas compactas al costado */}
        <aside className="flex flex-col bg-[#f7f8f4] px-5 py-6 sm:px-6 lg:py-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Salud de valoraciones
            </p>
            <span
              className={`mx-auto mt-4 inline-flex size-18 flex-col items-center justify-center rounded-2xl text-center font-bold leading-none ${healthStyle.badgeClassName}`}
            >
              <span className="text-2xl">{formattedAverage}</span>
              {metrics.averageCsat !== null ? (
                <span className="mt-0.5 text-[11px] font-semibold opacity-80">
                  /5
                </span>
              ) : null}
            </span>
            <p
              className={`mt-3 text-sm font-semibold leading-5 ${healthStyle.textClassName}`}
            >
              {metrics.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {metrics.scoredCount > 0
                ? `Promedio en ${metrics.scoredCount} ${
                    metrics.scoredCount === 1 ? "nota" : "notas"
                  }`
                : "Sin notas CSAT en el periodo"}
            </p>
          </div>

          <div className="my-6 border-t border-slate-200/80" />

          <div className="space-y-1 text-center">
            <p className="text-3xl font-semibold tabular-nums text-slate-950">
              {metrics.totalCount}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Recibidas
            </p>
            {metrics.scoredCount > 0 &&
            metrics.scoredCount !== metrics.totalCount ? (
              <p className="pt-1 text-xs text-slate-500">
                {metrics.totalCount - metrics.scoredCount} sin nota numérica
              </p>
            ) : null}
          </div>

          {metrics.scoredCount > 0 ? (
            <div className="mt-6 border-t border-slate-200/80 pt-5">
              <CsatHealthExplanation
                zoneCounts={zoneCounts}
                zonePercents={zonePercents}
                scoredCount={metrics.scoredCount}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function CommentDetailView({
  comment,
  onBack,
  onStatusChange,
  canManageFollowUp = false,
  followUpActions = [],
  isSaving = false,
  saveError = "",
  followUpNote = "",
  onFollowUpNoteChange,
  onSaveFollowUpNote,
}: {
  comment: DashboardComment;
  onBack: () => void;
  onStatusChange: (status: CommentStatus) => void;
  canManageFollowUp?: boolean;
  followUpActions?: FeedbackFollowUpAction[];
  isSaving?: boolean;
  saveError?: string;
  followUpNote?: string;
  onFollowUpNoteChange?: (value: string) => void;
  onSaveFollowUpNote?: () => void;
}) {
  const csatStyle = csatStyles[comment.csatScore] ?? csatStyles[3];
  const currentStatus = normalizeCommentStatus(comment.status);
  const responsibility =
    comment.sentiment === "Riesgo" || comment.csatScore <= 2
      ? "Gerencia de turno"
      : "Servicio al cliente";
  const operationalSummary = comment.analysisSummary?.trim() || csatStyle.meaning;
  const operationalAction =
    comment.recommendedAction?.trim() || csatStyle.action;
  const dominantPattern = comment.dominantPattern ?? "Experiencia del cliente";
  const canEscalate =
    currentStatus !== "Escalado" && currentStatus !== "Resuelto";
  const analysisSource =
    comment.analysisModel?.startsWith("gpt")
      ? "OpenAI"
      : comment.analysisModel
        ? "IA"
        : "Operativo";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-[#f7f8f4] p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a valoraciones
        </button>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Detalle de valoración
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
              {comment.business} · {comment.branch}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Vista operativa para entender la señal, dar seguimiento y dejar
              claro quién debe atenderla.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
                sentimentStyles[comment.sentiment] ?? sentimentStyles.Neutral,
              ].join(" ")}
            >
              {comment.sentiment}
            </span>
            <FeedbackTypeBadge type={comment.feedbackType} />
            <StatusBadge status={currentStatus} />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <section className="rounded-[1.25rem] border border-slate-100 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ClipboardCheck size={17} className="text-emerald-700" />
              Lectura operativa
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {analysisSource}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {dominantPattern}
                </span>
                {comment.analysisConfidence ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {comment.analysisConfidence}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-800">
                {operationalSummary}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f7f8f4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Próxima acción
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                {operationalAction}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Responsable
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {responsibility}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Estado
              </p>
              <div className="mt-2">
                <StatusBadge status={currentStatus} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <MessageSquareText size={17} className="text-emerald-700" />
            Valoración recibida
          </div>
          <p className="mt-4 text-base leading-8 text-slate-700">
            “{comment.message}”
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#f7f8f4] p-4">
              <MessageSquareText size={17} className="text-slate-400" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Tipo
              </p>
              <div className="mt-2">
                <FeedbackTypeBadge type={comment.feedbackType} />
              </div>
            </div>
            <div className="rounded-2xl bg-[#f7f8f4] p-4">
              <UserRound size={17} className="text-slate-400" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Cliente
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {comment.customer}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f8f4] p-4">
              <MapPin size={17} className="text-slate-400" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Punto
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {comment.branch}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f8f4] p-4">
              <Clock3 size={17} className="text-slate-400" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Recibido
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {comment.receivedAt}
              </p>
            </div>
          </div>

          <CsatScaleStrip score={comment.csatScore} />
        </section>

        <section className="rounded-[1.25rem] border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ClipboardCheck size={17} className="text-emerald-700" />
            Seguimiento
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              {canManageFollowUp ? (
                <div className="rounded-2xl border border-slate-100 p-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Estado de seguimiento
                    </span>
                    <select
                      value={currentStatus}
                      disabled={isSaving}
                      onChange={(event) =>
                        onStatusChange(event.target.value as CommentStatus)
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Cambiar estado de seguimiento"
                    >
                      {commentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {statusDescriptions[currentStatus]}
                  </p>
                  {canEscalate ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => onStatusChange("Escalado")}
                      className="mt-3 w-full rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Escalar a responsable
                    </button>
                  ) : null}
                  {isSaving ? (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Guardando seguimiento...
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-2xl border border-slate-100 p-4 text-sm leading-6 text-slate-500">
                  Solo gerencia puede actualizar el seguimiento de este caso.
                </p>
              )}
            </div>

            {canManageFollowUp ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Acción tomada
                  </p>
                  <span className="text-xs font-medium text-slate-400">
                    Opcional
                  </span>
                </div>
                <label className="block">
                  <span className="sr-only">Registrar acción tomada</span>
                  <textarea
                    value={followUpNote}
                    onChange={(event) =>
                      onFollowUpNoteChange?.(event.target.value)
                    }
                    maxLength={1000}
                    placeholder="Ej. Se habló con el equipo, se contactó al cliente o se ajustó el turno."
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <button
                  type="button"
                  disabled={isSaving || followUpNote.trim().length === 0}
                  onClick={onSaveFollowUpNote}
                  className="mt-3 w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Guardar nota de seguimiento
                </button>
              </div>
            ) : null}
          </div>

          {saveError ? (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {saveError}
            </p>
          ) : null}

          {followUpActions.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Historial de seguimiento
              </p>
              <ul className="mt-3 space-y-3">
                {followUpActions.map((action) => (
                  <li
                    key={action.id}
                    className="rounded-xl border border-slate-100 bg-[#f7f8f4] px-3 py-3"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {action.actorName} ·{" "}
                      {new Intl.DateTimeFormat("es-HN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(action.createdAt))}
                    </p>
                    {action.newStatus && action.previousStatus !== action.newStatus ? (
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Estado:{" "}
                        {action.previousStatus && isWorkflowStatus(action.previousStatus)
                          ? workflowStatusToLabel(action.previousStatus)
                          : action.previousStatus}{" "}
                        →{" "}
                        {isWorkflowStatus(action.newStatus)
                          ? workflowStatusToLabel(action.newStatus)
                          : action.newStatus}
                      </p>
                    ) : null}
                    {action.note ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {action.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}

function buildColumns(
  onView: (comment: DashboardComment) => void,
): Array<DashboardDataTableColumn<DashboardComment>> {
  return [
  {
    key: "customer",
    header: "Cliente",
    cell: (comment) => (
      <div>
        <p className="font-semibold text-slate-950">{comment.customer}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {comment.receivedAt}
        </p>
      </div>
    ),
  },
  {
    key: "business",
    header: "Negocio",
    cell: (comment) => (
      <div>
        <p className="font-semibold text-slate-800">{comment.business}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {comment.branch}
        </p>
      </div>
    ),
  },
  {
    key: "message",
    header: "Valoración",
    className: "min-w-[320px]",
    cell: (comment) => (
      <p className="max-w-xl leading-6 text-slate-600">{comment.message}</p>
    ),
  },
  {
    key: "feedbackType",
    header: "Tipo",
    cell: (comment) => <FeedbackTypeBadge type={comment.feedbackType} />,
  },
  {
    key: "sentiment",
    header: "Sentimiento",
    cell: (comment) => (
      <span
        className={[
          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
          sentimentStyles[comment.sentiment] ?? sentimentStyles.Neutral,
        ].join(" ")}
      >
        {comment.sentiment}
      </span>
    ),
  },
  {
    key: "csat",
    header: "CSAT",
    cell: (comment) => <CsatBadge score={comment.csatScore} />,
  },
  {
    key: "status",
    header: "Estado",
    cell: (comment) => <StatusBadge status={comment.status} />,
  },
  {
    key: "actions",
    header: "Acciones",
    className: "w-24 text-right",
    cell: (comment) => (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onView(comment);
        }}
        className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        aria-label={`Ver detalle de la valoración de ${comment.customer}`}
      >
        <Eye size={16} aria-hidden="true" />
      </button>
    ),
  },
];
}

async function persistFollowUp(params: {
  submissionId: string;
  status?: CommentStatus;
  note?: string;
}) {
  const workflowStatus = params.status
    ? labelToWorkflowStatus(params.status)
    : undefined;

  const response = await fetch(`/api/feedback/${params.submissionId}/follow-up`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      status: workflowStatus ?? undefined,
      note: params.note,
    }),
  });

  const body = (await response.json()) as {
    status?: CommentStatus;
    actions?: FeedbackFollowUpAction[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "No se pudo guardar el seguimiento.");
  }

  return body;
}

export function DashboardCommentsTable({
  comments = [],
  dateRange,
  canManageFollowUp = false,
  initialSelectedCommentId = null,
  onCloseDetail,
  onCommentUpdated,
}: DashboardCommentsTableProps) {
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const activeCommentId = initialSelectedCommentId ?? selectedCommentId;
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, CommentStatus>
  >({});
  const [followUpActions, setFollowUpActions] = useState<
    FeedbackFollowUpAction[]
  >([]);
  const [followUpNote, setFollowUpNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<ValoracionesTab>("listado");

  useEffect(() => {
    if (!activeCommentId) {
      return;
    }

    void fetch(`/api/feedback/${activeCommentId}/follow-up`, {
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as {
          actions?: FeedbackFollowUpAction[];
        };
        setFollowUpActions(body.actions ?? []);
      })
      .catch(() => {
        setFollowUpActions([]);
      });
  }, [activeCommentId]);

  const displayedComments = comments.map((comment) => ({
    ...comment,
    status:
      statusOverrides[comment.id] ?? normalizeCommentStatus(comment.status),
  }));
  const selectedComment =
    displayedComments.find((comment) => comment.id === activeCommentId) ??
    null;
  const branches = Array.from(
    new Set(displayedComments.map((comment) => comment.branch)),
  );
  const sentiments = Array.from(
    new Set(displayedComments.map((comment) => comment.sentiment)),
  );
  const feedbackTypes = Array.from(
    new Set([
      ...feedbackTypeOrder,
      ...displayedComments.map((comment) => comment.feedbackType),
    ]),
  );
  const columns = buildColumns((comment) => setSelectedCommentId(comment.id));

  async function updateSelectedCommentStatus(status: CommentStatus) {
    if (!activeCommentId) {
      return;
    }

    if (!canManageFollowUp) {
      setStatusOverrides((current) => ({
        ...current,
        [activeCommentId]: status,
      }));
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const result = await persistFollowUp({
        submissionId: activeCommentId,
        status,
        note: followUpNote.trim() || undefined,
      });
      const nextStatus = result.status
        ? normalizeCommentStatus(result.status)
        : status;

      setStatusOverrides((current) => ({
        ...current,
        [activeCommentId]: nextStatus,
      }));
      setFollowUpActions(result.actions ?? []);
      setFollowUpNote("");
      onCommentUpdated?.(activeCommentId, nextStatus);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo guardar el seguimiento.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveFollowUpNote() {
    if (!activeCommentId || followUpNote.trim().length === 0) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const result = await persistFollowUp({
        submissionId: activeCommentId,
        note: followUpNote.trim(),
      });
      setFollowUpActions(result.actions ?? []);
      setFollowUpNote("");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo guardar la nota.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (selectedComment) {
    return (
      <CommentDetailView
        comment={selectedComment}
        onBack={() => {
          setSelectedCommentId(null);
          onCloseDetail?.();
        }}
        onStatusChange={(status) => {
          void updateSelectedCommentStatus(status);
        }}
        canManageFollowUp={canManageFollowUp}
        followUpActions={followUpActions}
        isSaving={isSaving}
        saveError={saveError}
        followUpNote={followUpNote}
        onFollowUpNoteChange={setFollowUpNote}
        onSaveFollowUpNote={() => {
          void saveFollowUpNote();
        }}
      />
    );
  }

  const dateFilter = dateRange ? (
    <DashboardDateFilter dateRange={dateRange} targetHash="comentarios" />
  ) : null;

  if (activeTab === "graficos") {
    return (
      <div>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DashboardValoracionesTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {dateFilter}
        </div>
        <RatingsChartsPanel comments={displayedComments} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardValoracionesTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {dateFilter}
      </div>
      <DashboardDataTable
        data={displayedComments}
        columns={columns}
        getRowKey={(comment) => comment.id}
        onRowClick={(comment) => setSelectedCommentId(comment.id)}
        rowActionLabel={(comment) =>
          `Ver detalle de la valoración de ${comment.customer}`
        }
        getSearchText={(comment) =>
          [
            comment.customer,
            comment.business,
            comment.branch,
            comment.feedbackType,
            comment.sentiment,
            String(comment.csatScore),
            comment.status,
            comment.message,
          ].join(" ")
        }
        filters={[
          ...(branches.length > 0
            ? [
                {
                  key: "branch",
                  label: "Filtrar por sucursal",
                  options: branches,
                  getValue: (comment: DashboardComment) => comment.branch,
                  align: "left" as const,
                },
              ]
            : []),
          {
            key: "feedbackType",
            label: "Filtrar por tipo",
            options: feedbackTypes,
            getValue: (comment) => comment.feedbackType,
          },
          {
            key: "sentiment",
            label: "Filtrar por sentimiento",
            options: sentiments,
            getValue: (comment) => comment.sentiment,
          },
        ]}
        searchPlaceholder="Buscar valoración"
        pageSize={5}
        emptyTitle="Sin valoraciones registradas"
        topContent={<RatingsStatCards comments={displayedComments} />}
        showSearch={false}
      />
    </div>
  );
}

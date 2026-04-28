"use client";

import {
  Angry,
  ArrowLeft,
  Clock3,
  ClipboardCheck,
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
import { useId, useState } from "react";

import { DashboardDataTable } from "./dashboard-data-table";
import type { DashboardDataTableColumn } from "./dashboard-data-table";
import { dashboardMockComments } from "./dashboard.mock-data";

type DashboardComment = (typeof dashboardMockComments)[number];
type CommentStatus = "Nuevo" | "En revisión" | "Resuelto" | "Escalado";

type DashboardCommentsTableProps = {
  comments?: DashboardComment[];
};

const commentStatuses: CommentStatus[] = [
  "Nuevo",
  "En revisión",
  "Resuelto",
  "Escalado",
];

const sentimentStyles: Record<string, string> = {
  Positivo: "bg-emerald-50 text-emerald-800",
  Neutral: "bg-slate-100 text-slate-600",
  Riesgo: "bg-rose-50 text-rose-700",
};

const statusStyles: Record<CommentStatus, string> = {
  Nuevo: "bg-slate-100 text-slate-700",
  "En revisión": "bg-amber-50 text-amber-800",
  Resuelto: "bg-emerald-50 text-emerald-800",
  Escalado: "bg-rose-50 text-rose-700",
};

const statusDescriptions: Record<CommentStatus, string> = {
  Nuevo: "Entrada recibida, pendiente de revisión.",
  "En revisión": "El equipo ya está revisando el caso.",
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

  if (status === "Resuelto" || status === "Escalado" || status === "Nuevo") {
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
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

function CommentDetailView({
  comment,
  onBack,
  onStatusChange,
}: {
  comment: DashboardComment;
  onBack: () => void;
  onStatusChange: (status: CommentStatus) => void;
}) {
  const csatStyle = csatStyles[comment.csatScore] ?? csatStyles[3];
  const currentStatus = normalizeCommentStatus(comment.status);
  const responsibility =
    comment.sentiment === "Riesgo" || comment.csatScore <= 2
      ? "Gerencia de turno"
      : "Servicio al cliente";
  const suggestedStatus =
    currentStatus === "Nuevo" ? "En revisión" : currentStatus;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#f7f8f4] p-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a comentarios
        </button>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Detalle del comentario
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
            <StatusBadge status={currentStatus} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[1.25rem] border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <MessageSquareText size={17} className="text-emerald-700" />
            Comentario recibido
          </div>
          <p className="mt-4 text-base leading-8 text-slate-700">
            “{comment.message}”
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
        </div>

        <aside className="rounded-[1.25rem] border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ClipboardCheck size={17} className="text-emerald-700" />
            Lectura operativa
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Señal
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {csatStyle.meaning}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Acción sugerida
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {csatStyle.action}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Responsable sugerido
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {responsibility}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Estado actual
              </p>
              <div className="mt-2">
                <StatusBadge status={currentStatus} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {statusDescriptions[currentStatus]}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Cambiar estado
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {commentStatuses.map((status) => {
                const isSelected = status === currentStatus;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status)}
                    aria-pressed={isSelected}
                    className={[
                      "rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100",
                      isSelected
                        ? "border-emerald-900 bg-emerald-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900",
                    ].join(" ")}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onStatusChange(suggestedStatus)}
              className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {currentStatus === "Nuevo"
                ? "Marcar en revisión"
                : "Guardar estado"}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange("Escalado")}
              className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              Escalar seguimiento
            </button>
          </div>
        </aside>
      </div>
    </article>
  );
}

const columns: DashboardDataTableColumn<DashboardComment>[] = [
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
    header: "Comentario",
    className: "min-w-[320px]",
    cell: (comment) => (
      <p className="max-w-xl leading-6 text-slate-600">{comment.message}</p>
    ),
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
];

export function DashboardCommentsTable({
  comments = [],
}: DashboardCommentsTableProps) {
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, CommentStatus>
  >({});
  const displayedComments = comments.map((comment) => ({
    ...comment,
    status:
      statusOverrides[comment.id] ?? normalizeCommentStatus(comment.status),
  }));
  const selectedComment =
    displayedComments.find((comment) => comment.id === selectedCommentId) ??
    null;
  const businesses = Array.from(
    new Set(displayedComments.map((comment) => comment.business)),
  );
  const sentiments = Array.from(
    new Set(displayedComments.map((comment) => comment.sentiment)),
  );

  function updateSelectedCommentStatus(status: CommentStatus) {
    if (!selectedCommentId) {
      return;
    }

    setStatusOverrides((current) => ({
      ...current,
      [selectedCommentId]: status,
    }));
  }

  if (selectedComment) {
    return (
      <CommentDetailView
        comment={selectedComment}
        onBack={() => setSelectedCommentId(null)}
        onStatusChange={updateSelectedCommentStatus}
      />
    );
  }

  return (
    <DashboardDataTable
      data={displayedComments}
      columns={columns}
      getRowKey={(comment) => comment.id}
      onRowClick={(comment) => setSelectedCommentId(comment.id)}
      rowActionLabel={(comment) =>
        `Ver detalle del comentario de ${comment.customer}`
      }
      getSearchText={(comment) =>
        [
          comment.customer,
          comment.business,
          comment.branch,
          comment.sentiment,
          String(comment.csatScore),
          comment.status,
          comment.message,
        ].join(" ")
      }
      filters={[
        {
          key: "business",
          label: "Filtrar por negocio",
          options: businesses,
          getValue: (comment) => comment.business,
        },
        {
          key: "sentiment",
          label: "Filtrar por sentimiento",
          options: sentiments,
          getValue: (comment) => comment.sentiment,
        },
      ]}
      searchPlaceholder="Buscar comentario"
      pageSize={5}
      emptyTitle="Sin comentarios registrados"
    />
  );
}

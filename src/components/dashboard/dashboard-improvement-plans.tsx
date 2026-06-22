"use client";

import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Sparkles, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ImprovementNarrative } from "@/domain/dashboard/improvements-narrative";
import { groupCommentsByBranch } from "@/domain/dashboard/report-readiness";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";

// ── Chip renderer ─────────────────────────────────────────────────────────────

function NarrativeText({ text }: { text: string }) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return (
    <p className="text-sm leading-[2.15] text-slate-700">
      {parts.map((part, i) => {
        const match = part.match(/^\[\[(.*?)\]\]$/);
        if (match) {
          return (
            <span
              key={i}
              className="mx-0.5 my-1 inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[0.78rem] font-semibold leading-none text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {match[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────

const urgencyStyles: Record<ImprovementNarrative["urgency"], string> = {
  urgente: "bg-red-50 text-red-700 border-red-200",
  "esta semana": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "próximo ciclo": "bg-slate-100 text-slate-600 border-slate-200",
};

function UrgencyBadge({ urgency }: { urgency: ImprovementNarrative["urgency"] }) {
  return (
    <span
      className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold capitalize ${urgencyStyles[urgency]}`}
    >
      {urgency}
    </span>
  );
}

// ── Branch card (small, green when active) ────────────────────────────────────

function BranchCard({
  name,
  active,
  onClick,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap",
        active
          ? "bg-emerald-800 text-white shadow-sm shadow-emerald-900/20"
          : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
      ].join(" ")}
    >
      {name}
    </button>
  );
}

// ── Branch carousel ───────────────────────────────────────────────────────────

function BranchCarousel({
  narratives,
  activeBranchId,
  onSelect,
}: {
  narratives: ImprovementNarrative[];
  activeBranchId: string;
  onSelect: (branchId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  const showArrows = narratives.length > 4;

  return (
    <div className="flex items-center gap-2">
      {showArrows && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50"
          aria-label="Anterior"
        >
          <ChevronLeft size={15} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {narratives.map((n) => (
          <BranchCard
            key={n.branchId}
            name={n.branch}
            active={n.branchId === activeBranchId}
            onClick={() => onSelect(n.branchId)}
          />
        ))}
      </div>

      {showArrows && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50"
          aria-label="Siguiente"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

// ── Narrative card ────────────────────────────────────────────────────────────

function NarrativeCard({ narrative }: { narrative: ImprovementNarrative }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h4 className="text-base font-semibold leading-snug text-slate-950">
          {narrative.title}
        </h4>
        <UrgencyBadge urgency={narrative.urgency} />
      </div>
      <NarrativeText text={narrative.narrative} />
    </div>
  );
}

// ── Generate state ────────────────────────────────────────────────────────────

type GenerateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; narratives: ImprovementNarrative[] }
  | { status: "error"; message: string };

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardImprovementPlans({
  dashboardData,
}: {
  dashboardData?: DashboardSummaryData;
}) {
  const comments = dashboardData?.comments ?? [];
  const branchNames = [...groupCommentsByBranch(comments).keys()];

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [state, setState] = useState<GenerateState>({ status: "idle" });
  const [isHydrating, setIsHydrating] = useState(true);

  const period = dashboardData?.period?.includes("mes") ? "30d" : "7d";

  useEffect(() => {
    let cancelled = false;

    async function loadSavedNarratives() {
      setIsHydrating(true);
      try {
        const res = await fetch(`/api/improvements?period=${period}`);
        if (!res.ok || cancelled) {
          return;
        }

        const body = (await res.json()) as { narratives: ImprovementNarrative[] };
        if (!cancelled && body.narratives.length > 0) {
          setState({ status: "done", narratives: body.narratives });
          setSelectedBranchId(body.narratives[0]?.branchId ?? "");
        }
      } catch {
        // Si falla la carga, el usuario puede generar manualmente.
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    void loadSavedNarratives();

    return () => {
      cancelled = true;
    };
  }, [period]);

  if (branchNames.length === 0) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white p-6 text-sm leading-6 text-slate-500">
        Aún no hay suficiente base para generar un plan de mejora por sucursal.
      </div>
    );
  }

  async function handleGenerate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/improvements/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({ status: "error", message: body.error ?? "Error al generar mejoras." });
        return;
      }
      const body = (await res.json()) as { narratives: ImprovementNarrative[] };
      setState({ status: "done", narratives: body.narratives });
      if (body.narratives.length > 0 && body.narratives[0]) {
        setSelectedBranchId(body.narratives[0].branchId);
      }
    } catch {
      setState({ status: "error", message: "No se pudo conectar con el servidor." });
    }
  }

  const narratives = state.status === "done" ? state.narratives : [];
  const activeNarrative =
    narratives.find((n) => n.branchId === selectedBranchId) ?? narratives[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ClipboardList className="h-4 w-4 text-slate-400" aria-hidden />
              Plan de mejora por sucursal
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Síntesis en lenguaje natural de lo que ocurrió y qué atender primero,
              generada desde los comentarios del periodo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={state.status === "loading" || isHydrating}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:opacity-60"
          >
            {state.status === "loading" ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden />
                Analizando…
              </>
            ) : isHydrating ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden />
                Cargando…
              </>
            ) : (
              <>
                <Sparkles size={15} aria-hidden />
                {state.status === "done" ? "Regenerar mejoras" : "Generar mejoras con IA"}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error */}
      {state.status === "error" && (
        <div className="flex items-center gap-3 rounded-[1.15rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff size={15} aria-hidden className="shrink-0" />
          {state.message}
        </div>
      )}

      {/* Idle hint */}
      {!isHydrating && state.status === "idle" && (
        <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm leading-7 text-slate-400">
          Pulsa{" "}
          <span className="font-semibold text-slate-700">"Generar mejoras con IA"</span>{" "}
          para que el asistente analice los comentarios de cada sucursal y te dé una síntesis
          clara de qué atender primero.
        </div>
      )}

      {/* Results */}
      {state.status === "done" && narratives.length > 0 && activeNarrative && (
        <section className="space-y-3">
          {/* Branch carousel */}
          <BranchCarousel
            narratives={narratives}
            activeBranchId={activeNarrative.branchId}
            onSelect={setSelectedBranchId}
          />

          {/* Narrative */}
          <NarrativeCard narrative={activeNarrative} />
        </section>
      )}
    </div>
  );
}

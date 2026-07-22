"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FeedbackScreen } from "@/app/feedback/_shared/feedback-screen";
import type { FeedbackDemoSubmission } from "@/app/feedback/[branchSlug]/feedback-form";
import { DashboardAlertCard } from "@/components/dashboard/dashboard-alert-card";
import { DashboardCommentsTable } from "@/components/dashboard/dashboard-comments-table";
import { DashboardSummaryView } from "@/components/dashboard/dashboard-summary-view";
import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardCommentRow } from "@/domain/dashboard/schemas";
import {
  buildDemoCaseFromFeedback,
  buildDemoDashboardData,
  DEMO_ASSIGNEES,
  DEMO_BRANCH_ID,
  DEMO_BRANCH_NAME,
  DEMO_BRANCH_SLUG,
  DEMO_ORG_NAME,
  type DemoCase,
} from "@/lib/demo-guiada/session";
import { DEMO_STAGES, type DemoLead, type DemoStageId } from "@/lib/demo-guiada/steps";

type DemoTourProps = {
  lead: DemoLead;
  onRestartLead: () => void;
};

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function stageIndex(id: DemoStageId) {
  return DEMO_STAGES.findIndex((stage) => stage.id === id);
}

export function DemoTour({ lead, onRestartLead }: DemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [demoCase, setDemoCase] = useState<DemoCase | null>(null);
  const stage = DEMO_STAGES[stepIndex];
  const isLast = stepIndex === DEMO_STAGES.length - 1;
  const progress = useMemo(() => ((stepIndex + 1) / DEMO_STAGES.length) * 100, [stepIndex]);
  const dashboardData = useMemo(() => buildDemoDashboardData(demoCase), [demoCase]);

  const playCurrent = useCallback(() => {
    speak(DEMO_STAGES[stepIndex].narration);
  }, [stepIndex]);

  useEffect(() => {
    playCurrent();
    return () => stopSpeech();
  }, [playCurrent]);

  function goNext() {
    if (isLast) return;
    if (DEMO_STAGES[stepIndex + 1]?.requiresCase && !demoCase) return;
    stopSpeech();
    setStepIndex((current) => Math.min(current + 1, DEMO_STAGES.length - 1));
  }

  function goPrev() {
    if (stepIndex === 0) return;
    stopSpeech();
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function handleFeedbackComplete(submission: FeedbackDemoSubmission) {
    const nextCase = buildDemoCaseFromFeedback(submission);
    setDemoCase(nextCase);
    stopSpeech();
    setStepIndex(stageIndex("alerta"));
  }

  function updateAlert(alertId: string, next: Partial<DashboardAlertItem>) {
    setDemoCase((current) => {
      if (!current || current.alert.id !== alertId) return current;
      const alert = { ...current.alert, ...next };
      const comment: DashboardCommentRow = {
        ...current.comment,
        status:
          next.workflowStatus === "en_revision"
            ? "En revisión"
            : next.workflowStatus === "en_proceso"
              ? "En proceso"
              : next.workflowStatus === "escalado"
                ? "Escalado"
                : next.workflowStatus === "resuelto"
                  ? "Resuelto"
                  : current.comment.status,
      };
      return { comment, alert };
    });
  }

  function removeAlert(alertId: string) {
    setDemoCase((current) => {
      if (!current || current.alert.id !== alertId) return current;
      return {
        comment: { ...current.comment, status: "Resuelto" },
        alert: { ...current.alert, workflowStatus: "resuelto", unread: false },
      };
    });
  }

  function updateCommentStatus(commentId: string, status: DashboardCommentRow["status"]) {
    setDemoCase((current) => {
      if (!current || current.comment.id !== commentId) return current;
      return {
        ...current,
        comment: { ...current.comment, status },
        alert: {
          ...current.alert,
          workflowStatus:
            status === "En revisión"
              ? "en_revision"
              : status === "En proceso"
                ? "en_proceso"
                : status === "Escalado"
                  ? "escalado"
                  : status === "Resuelto"
                    ? "resuelto"
                    : "nuevo",
        },
      };
    });
  }

  const canGoNext =
    !isLast &&
    (!DEMO_STAGES[stepIndex + 1]?.requiresCase || Boolean(demoCase)) &&
    !(stage.id === "captura" && !demoCase);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">
            Recorrido guiado
          </p>
          <p className="mt-2 text-sm font-semibold text-[#536e64]">
            Hola, {lead.name.split(" ")[0]} · prueba con la UI real
          </p>
        </div>
        <button
          type="button"
          onClick={onRestartLead}
          className="text-sm font-bold text-[#08775f] transition hover:text-[#004c3c]"
        >
          Cambiar datos
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#d7e3da]">
        <div
          className="h-full rounded-full bg-[#0c8668] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative mt-5 flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a8f86]">
                {stepIndex + 1} / {DEMO_STAGES.length} · {stage.eyebrow}
              </p>
              <h2
                className="mt-1 text-[clamp(1.35rem,3vw,1.9rem)] font-bold leading-tight text-[#062f28]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stage.title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#536e64] sm:text-base">
                {stage.body}
              </p>
            </div>

            {stage.id === "captura" ? (
              <div className="overflow-hidden rounded-[12px] border border-[#d7e3da] bg-white shadow-[0_18px_40px_rgba(13,43,37,0.08)]">
                <FeedbackScreen
                  organizationName={DEMO_ORG_NAME}
                  branchName={DEMO_BRANCH_NAME}
                  branchId={DEMO_BRANCH_ID}
                  branchSlug={DEMO_BRANCH_SLUG}
                  tagline="Canal oficial de feedback · demo guiada"
                  siteHost="perks.demo"
                  demoMode
                  embedded
                  onDemoComplete={handleFeedbackComplete}
                />
              </div>
            ) : null}

            {stage.id === "alerta" && demoCase ? (
              <div className="mx-auto max-w-2xl rounded-[12px] border border-[#d7e3da] bg-[#f4f8f5] p-4 sm:p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#7a8f86]">
                  Vista real · Alertas
                </p>
                <DashboardAlertCard
                  alert={demoCase.alert}
                  assignees={DEMO_ASSIGNEES}
                  canManage={false}
                  demoMode
                  onUpdated={updateAlert}
                  onRemoved={removeAlert}
                  onOpenSubmission={() => setStepIndex(stageIndex("accion"))}
                />
              </div>
            ) : null}

            {(stage.id === "accion" || stage.id === "seguimiento") && demoCase ? (
              <div className="overflow-hidden rounded-[12px] border border-[#d7e3da] bg-[#f4f8f5] p-3 sm:p-4">
                <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a8f86]">
                  Vista real · Valoraciones
                </p>
                <DashboardCommentsTable
                  key={`${stage.id}-${demoCase.comment.id}`}
                  comments={[demoCase.comment]}
                  dateRange={dashboardData.dateRange}
                  canManageFollowUp={stage.id === "seguimiento"}
                  demoMode
                  initialSelectedCommentId={demoCase.comment.id}
                  onCommentUpdated={updateCommentStatus}
                />
                {stage.id === "seguimiento" ? (
                  <div className="mx-auto mt-4 max-w-2xl">
                    <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a8f86]">
                      Vista real · Seguimiento de alerta
                    </p>
                    <DashboardAlertCard
                      alert={demoCase.alert}
                      assignees={DEMO_ASSIGNEES}
                      canManage
                      demoMode
                      onUpdated={updateAlert}
                      onRemoved={removeAlert}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {stage.id === "sucursales" && demoCase ? (
              <div className="overflow-hidden rounded-[12px] border border-[#d7e3da] bg-[#f4f8f5] p-3 sm:p-4">
                <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a8f86]">
                  Vista real · Resumen multi-sucursal
                </p>
                <DashboardSummaryView
                  dashboardData={dashboardData}
                  alerts={[demoCase.alert]}
                />
              </div>
            ) : null}

            {stage.id === "cierre" ? (
              <section className="rounded-[12px] border border-[#d7e3da] bg-white px-5 py-7 sm:px-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08775f]">
                  Listo
                </p>
                <h3
                  className="mt-3 text-[clamp(1.7rem,4vw,2.4rem)] font-bold leading-[1.05] text-[#062f28]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ya probaste el flujo real de Perks
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#536e64]">
                  Tu comentario generó alerta, lectura operativa y seguimiento con la misma interfaz
                  del producto. Cuando reconectemos Supabase, este lead y el caso podrán migrarse.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoCase(null);
                      setStepIndex(stageIndex("captura"));
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#005542] px-5 text-sm font-bold text-white transition hover:bg-[#004434]"
                  >
                    Probar otro comentario
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[#b8c4bc] bg-[#fffdf7] px-5 text-sm font-bold text-[#143f35] transition hover:bg-white"
                  >
                    Entrar a la demo
                  </Link>
                </div>
              </section>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-full bg-[#0d2b25]/92 p-2 shadow-[0_18px_50px_rgba(8,28,22,0.28)] backdrop-blur-xl">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={playCurrent}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold text-white/85 transition hover:bg-white/10"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Repetir
        </button>
        <button
          type="button"
          onClick={playCurrent}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold text-white/85 transition hover:bg-white/10"
          aria-label="Reproducir narración"
        >
          <Volume2 size={15} aria-hidden="true" />
          Audio
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0d2b25] transition hover:bg-[#edf7f1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stage.id === "captura" && !demoCase ? "Envía el comentario" : "Siguiente"}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/login"
            className="ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-[#0d2b25] transition hover:bg-[#edf7f1]"
          >
            Continuar
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

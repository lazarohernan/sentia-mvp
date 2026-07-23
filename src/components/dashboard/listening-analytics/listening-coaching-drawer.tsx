"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { formatRelativeDate } from "@/domain/feedback/record-analysis";
import type { ListeningCoachingAction } from "@/domain/listening/coaching-actions";
import type { CoachingAiPrep } from "@/domain/listening/coaching-ai-prep";
import type { ListeningCollaboratorSummary } from "@/domain/listening/daily-summary";
import {
  listeningCoachingManagerPrompts,
  type ListeningEventRow,
} from "@/domain/listening/schemas";

type ListeningCoachingDrawerProps = {
  open: boolean;
  onClose: () => void;
  summary: ListeningCollaboratorSummary | null;
  events: ListeningEventRow[];
  canManage?: boolean;
  priorityReasons?: string[];
};

export function ListeningCoachingDrawer({
  open,
  onClose,
  summary,
  events,
  canManage = false,
  priorityReasons = [],
}: ListeningCoachingDrawerProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [actionText, setActionText] = useState("");
  const [savedAction, setSavedAction] = useState<ListeningCoachingAction | null>(
    null,
  );
  const [prep, setPrep] = useState<CoachingAiPrep | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isLoadingPrep, setIsLoadingPrep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !summary) {
      return;
    }

    let active = true;
    setError("");
    setSuccess("");
    setActionText("");
    setSavedAction(null);
    setPrep(null);
    setIsLoadingAction(true);
    setIsLoadingPrep(true);

    void fetch(
      `/api/listening/coaching-actions?subjectUserId=${encodeURIComponent(summary.userId)}`,
      { credentials: "same-origin" },
    )
      .then(async (response) => {
        const body = (await response.json()) as {
          action?: ListeningCoachingAction | null;
          error?: string;
        };
        if (!active) return;
        if (!response.ok) {
          setError(body.error ?? "No se pudo cargar la acción acordada.");
          return;
        }
        const action = body.action ?? null;
        setSavedAction(action);
        setActionText(action?.actionText ?? "");
      })
      .catch(() => {
        if (active) {
          setError("No se pudo conectar con el servidor.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAction(false);
        }
      });

    void fetch("/api/listening/coaching-prep", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectUserId: summary.userId }),
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          prep?: CoachingAiPrep;
          error?: string;
        };
        if (!active) return;
        if (response.ok && body.prep) {
          setPrep(body.prep);
        }
      })
      .catch(() => {
        // Fallback estático más abajo.
      })
      .finally(() => {
        if (active) {
          setIsLoadingPrep(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, summary]);

  if (!open || !mounted || !summary) {
    return null;
  }

  const recentEvents = [...events]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 8);

  const lastLevel = recentEvents[0]?.level;
  const fallbackQuestions = lastLevel
    ? listeningCoachingManagerPrompts[lastLevel]
    : [
        "¿Qué ha funcionado bien en tus conversaciones recientes?",
        "¿Dónde sientes que podrías escuchar con más calma la próxima vez?",
      ];
  const questions = prep?.questions?.length ? prep.questions : fallbackQuestions;
  const insight =
    prep?.insight ||
    (priorityReasons[0]
      ? priorityReasons.join(" · ")
      : "Revisa el historial y elige una pregunta para abrir la conversación.");

  async function handleSave() {
    if (!summary || !canManage) return;

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/listening/coaching-actions", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectUserId: summary.userId,
          actionText,
        }),
      });
      const body = (await response.json()) as {
        action?: ListeningCoachingAction;
        error?: string;
      };

      if (!response.ok || !body.action) {
        setError(body.error ?? "No se pudo guardar la acción.");
        return;
      }

      setSavedAction(body.action);
      setActionText(body.action.actionText);
      setSuccess("Acción guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar coaching"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listening-coaching-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Coaching</p>
            <h2
              id="listening-coaching-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              {summary.userName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {summary.branchName} · {summary.eventCount} registro
              {summary.eventCount === 1 ? "" : "s"} · Media {summary.averageLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Lectura rápida
            </p>
            {isLoadingPrep ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Preparando…
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-700">{insight}</p>
            )}
            {priorityReasons.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Señales: {priorityReasons.join(" · ")}
              </p>
            ) : null}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-950">
              Historial reciente
            </h3>
            {recentEvents.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sin registros en este periodo.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recentEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">
                        {event.levelLabel}
                      </p>
                      <p className="shrink-0 text-xs text-slate-400">
                        {formatRelativeDate(event.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {event.note?.trim() || "Sin nota."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-950">
              Preguntas para la conversación
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Solo para ti. No se envían al colaborador.
            </p>
            <ul className="mt-3 space-y-2">
              {questions.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-950">
              Acordamos
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Una acción concreta para el siguiente periodo.
            </p>
            {isLoadingAction ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando…
              </p>
            ) : (
              <>
                <textarea
                  value={actionText}
                  onChange={(event) => setActionText(event.target.value)}
                  maxLength={500}
                  disabled={!canManage || isSaving}
                  placeholder="Ej. En el próximo turno, pedir un ejemplo antes de proponer solución."
                  className="field-control mt-3 min-h-28 w-full rounded-lg bg-white px-3 py-3 text-sm leading-6 text-slate-800"
                />
                {savedAction ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Última actualización: {formatRelativeDate(savedAction.updatedAt)}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-3 text-sm font-medium text-red-700">{error}</p>
                ) : null}
                {success ? (
                  <p className="mt-3 text-sm font-medium text-slate-700">{success}</p>
                ) : null}
              </>
            )}
          </section>
        </div>

        {canManage ? (
          <div className="border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isLoadingAction || actionText.trim().length === 0}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isSaving ? "Guardando..." : "Guardar acción"}
            </button>
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

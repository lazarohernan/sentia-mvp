"use client";

import {
  Angry,
  Frown,
  Laugh,
  Meh,
  Send,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { assessInformationQuality } from "@/domain/feedback/adaptive-follow-up";
import type { FeedbackType } from "@/domain/feedback/schemas";

const csatOptions: Array<{
  score: number;
  label: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    score: 1,
    label: "Muy mal",
    icon: Angry,
    tone:
      "text-rose-700 bg-rose-50 border-rose-100 has-checked:border-rose-500 has-checked:bg-rose-100",
  },
  {
    score: 2,
    label: "Mal",
    icon: Frown,
    tone:
      "text-orange-700 bg-orange-50 border-orange-100 has-checked:border-orange-500 has-checked:bg-orange-100",
  },
  {
    score: 3,
    label: "Normal",
    icon: Meh,
    tone:
      "text-slate-600 bg-slate-50 border-slate-200 has-checked:border-slate-400 has-checked:bg-slate-100",
  },
  {
    score: 4,
    label: "Bien",
    icon: Smile,
    tone:
      "text-emerald-700 bg-emerald-50 border-emerald-100 has-checked:border-emerald-600 has-checked:bg-emerald-100",
  },
  {
    score: 5,
    label: "Excelente",
    icon: Laugh,
    tone:
      "text-emerald-900 bg-emerald-50 border-emerald-200 has-checked:border-emerald-800 has-checked:bg-emerald-100",
  },
];

function inferFeedbackType(csatScore: number): FeedbackType {
  if (csatScore <= 2) return "complaint";
  if (csatScore === 3) return "suggestion";
  return "compliment";
}

export type FeedbackDemoSubmission = {
  csatScore: number;
  freeText: string;
  clarificationCategory?: string;
  clarificationDetail?: string;
  clarificationQuestion?: string | null;
};

type FeedbackFormProps = {
  branchId?: string;
  branchSlug: string;
  branchToken?: string;
  demoMode?: boolean;
  onDemoComplete?: (submission: FeedbackDemoSubmission) => void;
};

type FormStatus = "idle" | "clarifying" | "submitting" | "success" | "error";

const clarificationOptions = [
  { value: "customer_service", label: "Atención" },
  { value: "wait_time", label: "Espera" },
  { value: "product_quality", label: "Producto" },
  { value: "cleanliness", label: "Limpieza" },
  { value: "price", label: "Precio" },
  { value: "environment", label: "Ambiente" },
  { value: "billing", label: "Pago" },
  { value: "other", label: "Otro" },
] as const;

type ClarificationCategory = (typeof clarificationOptions)[number]["value"];

export function FeedbackForm({
  branchId,
  branchSlug,
  branchToken,
  demoMode = false,
  onDemoComplete,
}: FeedbackFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) return;

    void fetch("/api/feedback/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchSlug }),
    }).catch(() => undefined);
  }, [branchSlug, demoMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const csatScore = Number(formData.get("csatScore"));
    const freeText = String(formData.get("freeText") ?? "").trim();
    const consentAccepted = formData.get("consentAccepted") === "on";
    const clarificationCategory = String(
      formData.get("clarificationCategory") ?? "",
    ).trim();
    const clarificationDetail = String(formData.get("clarificationDetail") ?? "").trim();

    if (!Number.isInteger(csatScore) || csatScore < 1 || csatScore > 5) {
      setStatus("error");
      setErrorMessage("Selecciona una calificacion para continuar.");
      return;
    }

    if (freeText.length < 8) {
      setStatus("error");
      setErrorMessage("Escribe al menos 8 caracteres en tu comentario.");
      return;
    }

    if (!consentAccepted) {
      setStatus("error");
      setErrorMessage("Debes aceptar el uso de tu comentario para enviarlo.");
      return;
    }

    const qualityAssessment = assessInformationQuality({
      freeText,
      csatScore,
      emotionScore: csatScore,
      clarification:
        clarificationCategory || clarificationDetail
          ? {
              question: clarificationQuestion ?? undefined,
              category: clarificationCategory
                ? (clarificationCategory as ClarificationCategory)
                : undefined,
              detail: clarificationDetail || undefined,
            }
          : undefined,
    });

    if (
      qualityAssessment.shouldAsk &&
      !clarificationCategory &&
      !clarificationDetail &&
      status !== "clarifying"
    ) {
      setStatus("clarifying");
      setClarificationQuestion(
        qualityAssessment.question ?? "¿Qué fue lo principal de tu experiencia?",
      );
      return;
    }

    if (status === "clarifying" && !clarificationCategory && !clarificationDetail) {
      setErrorMessage("Selecciona un motivo o agrega un detalle corto para continuar.");
      return;
    }

    setStatus("submitting");

    const clarificationPayload =
      clarificationCategory || clarificationDetail
        ? {
            question: clarificationQuestion ?? qualityAssessment.question,
            category: clarificationCategory || undefined,
            detail: clarificationDetail || undefined,
          }
        : undefined;

    if (demoMode) {
      onDemoComplete?.({
        csatScore,
        freeText,
        clarificationCategory: clarificationCategory || undefined,
        clarificationDetail: clarificationDetail || undefined,
        clarificationQuestion: clarificationPayload?.question ?? clarificationQuestion,
      });
      setStatus("success");
      setClarificationQuestion(null);
      form.reset();
      return;
    }

    if (!branchId || !branchToken) {
      setStatus("error");
      setErrorMessage("Este enlace de feedback no es valido. Usa el QR firmado de la sucursal.");
      return;
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchSlug,
          branchId,
          branchToken,
          type: inferFeedbackType(csatScore),
          csatScore,
          emotionScore: csatScore,
          freeText,
          clarification: clarificationPayload,
          consentAccepted: true,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setStatus("error");
        setErrorMessage(
          body?.message ??
            (response.status === 429
              ? "Demasiados intentos. Intenta de nuevo en unos minutos."
              : "No se pudo enviar tu comentario. Intenta de nuevo."),
        );
        return;
      }

      setStatus("success");
      setClarificationQuestion(null);
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("No se pudo enviar tu comentario. Revisa tu conexion.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-950">
          Gracias por tu comentario
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          Tu experiencia fue registrada. El equipo la revisara pronto.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white"
        >
          Enviar otro comentario
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5">
      <fieldset disabled={status === "submitting"}>
        <legend className="text-sm font-medium text-slate-700">
          Que tan satisfecho quedaste con esta experiencia?
        </legend>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {csatOptions.map((option) => {
            const Icon = option.icon;

            return (
              <label
                key={option.score}
                className={[
                  "flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition has-checked:ring-4 has-checked:ring-emerald-100",
                  option.tone,
                ].join(" ")}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="csatScore"
                  value={option.score}
                  required
                />
                <span className="flex size-9 items-center justify-center rounded-full bg-white/70">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="mt-2 text-[11px] font-semibold leading-tight">
                  {option.label}
                </span>
                <span className="sr-only">{option.score} de 5</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-slate-700">
          Contanos que paso
        </span>
        <textarea
          name="freeText"
          required
          minLength={8}
          maxLength={2000}
          disabled={status === "submitting"}
          className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
          placeholder="Escribi una queja, sugerencia o felicitacion."
        />
      </label>

      {status === "clarifying" ? (
        <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {clarificationQuestion}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {clarificationOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-white bg-white px-3 text-center text-sm font-semibold text-slate-600 shadow-sm transition has-checked:border-sky-400 has-checked:bg-sky-100 has-checked:text-sky-950"
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="clarificationCategory"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Detalle opcional
            </span>
            <textarea
              name="clarificationDetail"
              maxLength={500}
              className="mt-2 min-h-20 w-full rounded-md border border-sky-100 bg-white px-3 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/30 disabled:bg-slate-50"
              placeholder="Ejemplo: la espera fue larga, el producto llegó frío o la atención fue confusa."
            />
          </label>
        </div>
      ) : null}

      <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          name="consentAccepted"
          required
          disabled={status === "submitting"}
          className="mt-1 size-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700/20"
        />
        <span>
          Acepto que mi comentario se use para mejorar la experiencia en esta
          sucursal.
        </span>
      </label>

      {errorMessage ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={status === "submitting"}
      >
        <Send size={16} aria-hidden="true" />
        {status === "submitting"
          ? "Enviando..."
          : status === "clarifying"
            ? "Enviar con ese detalle"
            : "Enviar comentario"}
      </button>
    </form>
  );
}

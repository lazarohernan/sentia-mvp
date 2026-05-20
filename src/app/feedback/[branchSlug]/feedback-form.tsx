"use client";

import {
  Angry,
  Frown,
  Laugh,
  Meh,
  MessageSquareText,
  Send,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

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

type FeedbackFormProps = {
  branchSlug: string;
  branchName: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

export function FeedbackForm({ branchSlug, branchName }: FeedbackFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/feedback/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchSlug }),
    }).catch(() => undefined);
  }, [branchSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const csatScore = Number(formData.get("csatScore"));
    const freeText = String(formData.get("freeText") ?? "").trim();
    const consentAccepted = formData.get("consentAccepted") === "on";

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

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchSlug,
          type: inferFeedbackType(csatScore),
          csatScore,
          emotionScore: csatScore,
          freeText,
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
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-950 text-white">
          <MessageSquareText size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Sucursal</p>
          <h1 className="text-xl font-semibold">{branchName}</h1>
        </div>
      </div>

      <fieldset className="mt-6" disabled={status === "submitting"}>
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
        {status === "submitting" ? "Enviando..." : "Enviar comentario"}
      </button>
    </form>
  );
}

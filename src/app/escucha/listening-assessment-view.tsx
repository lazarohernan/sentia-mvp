"use client";

import {
  ArrowLeft,
  Loader2,
  Save,
  Smile,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Branch } from "@/domain/branches/schemas";
import {
  listeningLevelDescriptions,
  listeningLevelLabels,
  listeningLevelReflectionPrompts,
} from "@/domain/listening/schemas";
import type { ListeningEventRow } from "@/domain/listening/schemas";

type ListeningAssessmentViewProps = {
  assignedBranch: Branch | null;
  organizationName?: string;
  backHref?: string;
};

type LevelKey = ListeningEventRow["level"];

const levels: Array<{
  key: LevelKey;
  label: string;
  description: string;
  color: string;
}> = [
  {
    key: "download",
    label: listeningLevelLabels.download,
    description: listeningLevelDescriptions.download,
    color: "#94a3b8",
  },
  {
    key: "debate",
    label: listeningLevelLabels.debate,
    description: listeningLevelDescriptions.debate,
    color: "#14b8a6",
  },
  {
    key: "empathetic_listening",
    label: listeningLevelLabels.empathetic_listening,
    description: listeningLevelDescriptions.empathetic_listening,
    color: "#0f766e",
  },
  {
    key: "generative_dialogue",
    label: listeningLevelLabels.generative_dialogue,
    description: listeningLevelDescriptions.generative_dialogue,
    color: "#0f2f5f",
  },
];

export function ListeningAssessmentView({
  assignedBranch,
  organizationName,
  backHref = "/dashboard/escucha",
}: ListeningAssessmentViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | null>(null);
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const reflectionPromptId = "listening-reflection-prompt";
  const selectedReflectionPrompt = selectedLevel
    ? listeningLevelReflectionPrompts[selectedLevel]
    : "Elige un nivel a la izquierda y te proponemos una pregunta para guiar tu reflexión.";

  const backLink = (
    <Link
      href={backHref}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Volver
    </Link>
  );

  async function handleSubmit() {
    if (!selectedLevel || !assignedBranch) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listening-events", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: assignedBranch.id,
          level: selectedLevel,
          note: reflection.trim() || undefined,
        }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "No se pudo guardar el registro.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
        <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-6 sm:px-8">
          <nav className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <img src="/brand/perks-logo.png" alt="Perks" className="h-12 w-auto" />
            <p className="text-sm font-semibold text-slate-500">
              {organizationName ?? "Tu organización"}
            </p>
          </nav>
          <div className="pt-4">{backLink}</div>

          <div className="flex flex-1 items-center justify-center py-16">
            <section className="w-full text-center">
              <span className="mx-auto flex size-12 items-center justify-center text-slate-950">
                <Smile className="h-10 w-10" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
                Opinión enviada. Gracias.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                Tu registro de escucha quedó guardado para este turno.
              </p>
              <div className="mt-6 flex justify-center">{backLink}</div>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <img src="/brand/perks-logo.png" alt="Perks" className="h-12 w-auto" />

          <p className="text-sm font-semibold text-slate-500">
            {organizationName ?? "Tu organización"}
          </p>
        </nav>
        <div className="pt-4">{backLink}</div>

        <header className="flex flex-col gap-5 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Niveles de escucha
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                ¿Cómo escuchaste hoy?
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Elige el nivel que mejor describe cómo estuviste escuchando
                durante tu turno. Esta práctica es para desarrollo, no para
                sanción.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                <span>Cierre de turno</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                <span>{assignedBranch?.name ?? "Sucursal pendiente"}</span>
              </div>
            </div>
          </header>

          <div className="grid gap-6 pb-8 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Selecciona una opción
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Usa como referencia una conversación real o el momento más
                  representativo del turno.
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {levels.map((level) => (
                  <label
                    key={level.key}
                    className={[
                      "block cursor-pointer rounded-2xl border p-4 transition",
                      selectedLevel === level.key
                        ? "border-slate-950 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                        : "border-slate-100 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="listening-level"
                        value={level.key}
                        checked={selectedLevel === level.key}
                        onChange={() => setSelectedLevel(level.key)}
                        className="mt-1 size-4 shrink-0 accent-slate-950"
                      />
                      <div>
                        <p className="font-semibold text-slate-950">{level.label}</p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                          {level.description}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Pregunta para tu reflexión
                  </p>
                  <p
                    id={reflectionPromptId}
                    className="mt-2 text-sm font-medium leading-6 text-slate-800"
                  >
                    {selectedReflectionPrompt}
                  </p>
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-700">
                    Reflexión del turno
                  </span>
                  <textarea
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                    maxLength={500}
                    aria-describedby={reflectionPromptId}
                    placeholder={
                      selectedLevel
                        ? "Comparte el momento que te vino a la mente. Unas líneas bastan."
                        : "Primero elige el nivel que mejor describe tu turno."
                    }
                    className="mt-2 min-h-36 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>

                {error ? (
                  <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedLevel || !assignedBranch || isSubmitting}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f5f49] px-4 text-sm font-bold text-white transition hover:bg-[#0b4b3a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isSubmitting ? "Guardando..." : "Guardar evaluación"}
                </button>
              </section>
            </aside>
          </div>
      </section>
    </main>
  );
}

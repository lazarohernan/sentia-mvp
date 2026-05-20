"use client";

import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { Branch } from "@/domain/branches/schemas";

type ListeningAssessmentViewProps = {
  assignedBranch: Branch | null;
  organizationName?: string;
};

type LevelKey = "download" | "factual" | "empathetic" | "generative";

const levels: Array<{
  key: LevelKey;
  label: string;
  description: string;
  color: string;
}> = [
  {
    key: "download",
    label: "Descarga",
    description: "Escuché desde hábitos, juicio rápido o respuestas automáticas.",
    color: "#94a3b8",
  },
  {
    key: "factual",
    label: "Factual",
    description: "Noté datos nuevos o algo distinto a lo que esperaba.",
    color: "#14b8a6",
  },
  {
    key: "empathetic",
    label: "Escucha empática",
    description: "Pude escuchar desde la experiencia y emoción de la otra persona.",
    color: "#0f766e",
  },
  {
    key: "generative",
    label: "Diálogo generativo",
    description: "La conversación abrió una posibilidad o decisión nueva.",
    color: "#0f2f5f",
  },
];

const initialValues: Record<LevelKey, number> = {
  download: 25,
  factual: 25,
  empathetic: 35,
  generative: 15,
};

export function ListeningAssessmentView({
  assignedBranch,
  organizationName,
}: ListeningAssessmentViewProps) {
  const [values, setValues] = useState(initialValues);
  const [shiftFrom, setShiftFrom] = useState<LevelKey>("download");
  const [shiftTo, setShiftTo] = useState<LevelKey>("empathetic");
  const [reflection, setReflection] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const total = useMemo(
    () => Object.values(values).reduce((sum, value) => sum + value, 0),
    [values],
  );
  const isBalanced = total === 100;

  function updateLevel(level: LevelKey, value: number) {
    setValues((current) => ({ ...current, [level]: value }));
  }

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <p
            className="text-4xl font-bold leading-none text-[#053f34]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Perks
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:inline-flex">
              {organizationName ?? "Tu organización"}
            </span>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              Evaluación diaria
            </span>
          </div>
        </nav>

        <header className="flex flex-col gap-5 py-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Niveles de escucha
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Cierre de escucha del turno
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Registra cómo escuchaste hoy y qué cambio notaste en una conversación real. Esta práctica es para desarrollo, no para sanción.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                <Clock3 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Cierre de turno
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                <Building2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                {assignedBranch?.name ?? "Sucursal pendiente"}
              </span>
            </div>
          </header>

          <div className="grid gap-6 pb-8 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Reparte tu escucha de hoy
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Ajusta los porcentajes. El total debe cerrar en 100%.
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    isBalanced
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {isBalanced ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="h-4 w-4" aria-hidden="true" />
                  )}
                  Total {total}%
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {levels.map((level) => (
                  <label key={level.key} className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{level.label}</p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                          {level.description}
                        </p>
                      </div>
                      <span
                        className="inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold text-white"
                        style={{ backgroundColor: level.color }}
                      >
                        {values[level.key]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={values[level.key]}
                      onChange={(event) =>
                        updateLevel(level.key, Number(event.target.value))
                      }
                      className="mt-4 w-full accent-emerald-700"
                    />
                  </label>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-lg font-semibold text-slate-950">
                  Contexto del turno
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                      Sucursal asignada
                    </span>
                    <p className="mt-1 font-semibold text-slate-950">
                      {assignedBranch?.name ?? "Pendiente de asignación"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {assignedBranch
                        ? "Esta evaluación quedará vinculada automáticamente a esta sucursal."
                        : "Un gerente debe asignarte una sucursal antes de guardar evaluaciones."}
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Reflexión del turno
                    </span>
                    <textarea
                      value={reflection}
                      onChange={(event) => setReflection(event.target.value)}
                      maxLength={800}
                      placeholder="Describe una conversación o momento donde notaste cómo estabas escuchando."
                      className="mt-2 min-h-36 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-lg font-semibold text-slate-950">
                  Cambio percibido
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Marca si una conversación te movió de un nivel a otro.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <label>
                    <span className="text-sm font-semibold text-slate-700">De</span>
                    <select
                      value={shiftFrom}
                      onChange={(event) => setShiftFrom(event.target.value as LevelKey)}
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {levels.map((level) => (
                        <option key={level.key} value={level.key}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ArrowRight className="mb-3 hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />
                  <label>
                    <span className="text-sm font-semibold text-slate-700">A</span>
                    <select
                      value={shiftTo}
                      onChange={(event) => setShiftTo(event.target.value as LevelKey)}
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {levels.map((level) => (
                        <option key={level.key} value={level.key}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <Bell className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    Recordatorios
                  </span>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(event) => setRemindersEnabled(event.target.checked)}
                    className="size-5 accent-emerald-700"
                  />
                </label>

                <button
                  type="button"
                  disabled={!isBalanced || !assignedBranch}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f5f49] px-4 text-sm font-bold text-white transition hover:bg-[#0b4b3a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Guardar evaluación
                </button>
              </section>
            </aside>
          </div>
      </section>
    </main>
  );
}

"use client";

import { CalendarClock, Loader2, Save } from "lucide-react";
import { useState } from "react";

import {
  getReportCadenceSettingMeta,
  type ReportCadence,
} from "@/domain/dashboard/report-cadence";

type DashboardReportCadenceSettingsPanelProps = {
  initialCadence?: ReportCadence;
  canManage?: boolean;
  onSaved?: (cadence: ReportCadence) => void;
};

const cadenceOptions: Array<{
  value: ReportCadence;
  title: string;
  detail: string;
}> = [
  {
    value: "weekly",
    title: "Semanal",
    detail: "Cada 7 días · periodo de la semana",
  },
  {
    value: "monthly",
    title: "Mensual",
    detail: "Cada mes · periodo de 30 días",
  },
  {
    value: "both",
    title: "Ambas",
    detail: "Pulso semanal y cierre mensual",
  },
];

export function DashboardReportCadenceSettingsPanel({
  initialCadence = "monthly",
  canManage = false,
  onSaved,
}: DashboardReportCadenceSettingsPanelProps) {
  const [cadence, setCadence] = useState<ReportCadence>(initialCadence);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cadenceMeta = getReportCadenceSettingMeta(cadence);

  async function handleSave() {
    if (!canManage) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/organization/settings/report-cadence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reportCadence: cadence }),
      });

      const body = (await response.json()) as {
        reportCadence?: ReportCadence;
        error?: string;
      };

      if (!response.ok || !body.reportCadence) {
        setError(body.error ?? "No se pudo guardar la cadencia del informe.");
        return;
      }

      setCadence(body.reportCadence);
      onSaved?.(body.reportCadence);
      setSuccess("Cadencia guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            Entrega del informe
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Define con qué frecuencia tu equipo revisa y comparte el informe
            operativo.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {cadenceOptions.map((option) => {
          const isSelected = cadence === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={!canManage}
              onClick={() => setCadence(option.value)}
              aria-pressed={isSelected}
              className={[
                "rounded-2xl border p-4 text-left transition",
                isSelected
                  ? "border-slate-950 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                  : "border-slate-100 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                !canManage ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              <p className="font-semibold text-slate-950">{option.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {option.detail}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        {cadenceMeta.frequencyHint}
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {success}
        </p>
      ) : null}

      {canManage ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Guardando..." : "Guardar cadencia"}
        </button>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          Solo gerencia puede cambiar esta configuración.
        </p>
      )}
    </section>
  );
}

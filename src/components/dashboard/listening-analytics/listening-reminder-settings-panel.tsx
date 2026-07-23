"use client";

import { Bell, Clock3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  listeningWeekdays,
  type ListeningWeekday,
  type ListeningSettings,
} from "@/domain/listening/settings";

type ListeningReminderSettingsPanelProps = {
  initialSettings: ListeningSettings;
  canManage?: boolean;
  titleId?: string;
};

const weekdayLabels: Record<ListeningWeekday, string> = {
  mon: "L",
  tue: "M",
  wed: "X",
  thu: "J",
  fri: "V",
  sat: "S",
  sun: "D",
};

const weekdayNames: Record<ListeningWeekday, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miercoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sabado",
  sun: "Domingo",
};

export function ListeningReminderSettingsPanel({
  initialSettings,
  canManage = false,
  titleId,
}: ListeningReminderSettingsPanelProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  function updateTime(index: number, value: string) {
    setSettings((current) => ({
      ...current,
      reminderTimes: current.reminderTimes.map((time, timeIndex) =>
        timeIndex === index ? value : time,
      ),
    }));
  }

  function addTime() {
    setSettings((current) => ({
      ...current,
      reminderTimes: [...current.reminderTimes, "09:00"].slice(0, 5),
    }));
  }

  function removeTime(index: number) {
    setSettings((current) => ({
      ...current,
      reminderTimes: current.reminderTimes.filter((_, timeIndex) => timeIndex !== index),
    }));
  }

  function toggleWeekday(day: ListeningWeekday) {
    setSettings((current) => {
      const isSelected = current.reminderWeekdays.includes(day);

      if (isSelected && current.reminderWeekdays.length === 1) {
        return current;
      }

      return {
        ...current,
        reminderWeekdays: isSelected
          ? current.reminderWeekdays.filter((weekday) => weekday !== day)
          : listeningWeekdays.filter(
              (weekday) =>
                current.reminderWeekdays.includes(weekday) || weekday === day,
            ),
      };
    });
  }

  async function saveSettings() {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listening/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = (await response.json()) as {
        settings?: ListeningSettings;
        error?: string;
      };

      if (!response.ok || !body.settings) {
        setError(body.error ?? "No se pudo guardar la configuracion.");
        return;
      }

      setSettings(body.settings);
      setSuccess("Configuracion guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function triggerSurvey() {
    setError("");
    setSuccess("");
    setIsTriggering(true);

    try {
      const response = await fetch("/api/listening/reminders/trigger", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await response.json()) as {
        createdCount?: number;
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "No se pudo enviar la encuesta.");
        return;
      }

      setSuccess(
        body.createdCount && body.createdCount > 0
          ? `Encuesta enviada a ${body.createdCount} colaborador(es).`
          : "No hay colaboradores activos para enviar la encuesta.",
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsTriggering(false);
    }
  }

  return (
    <section className="bg-white p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Recordatorios
          </p>
          <h2 id={titleId} className="mt-1 text-lg font-semibold text-slate-950">
            Horarios de escucha
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
            Define los momentos del dia en que los colaboradores registraran su
            nivel de escucha.
          </p>
        </div>
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <label className="flex items-start justify-between gap-4 rounded-xl bg-[#f7f8f4] px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Activar recordatorios
            </span>
            <span className="mt-1 block text-sm leading-5 text-slate-500">
              Mantiene preparada la agenda diaria para el equipo.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.remindersEnabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                remindersEnabled: event.target.checked,
              }))
            }
            disabled={!canManage || isSubmitting}
            className="mt-1 size-5 accent-slate-950"
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-700">Dias de envio</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            La encuesta solo se enviara en los dias marcados.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {listeningWeekdays.map((day) => {
              const isSelected = settings.reminderWeekdays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  disabled={
                    !canManage ||
                    isSubmitting ||
                    (isSelected && settings.reminderWeekdays.length === 1)
                  }
                  aria-pressed={isSelected}
                  aria-label={weekdayNames[day]}
                  title={weekdayNames[day]}
                  className={[
                    "flex size-8 items-center justify-center rounded-lg text-xs font-bold transition focus:outline-none focus-visible:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
                    isSelected
                      ? "border-emerald-800 bg-emerald-800 text-white shadow-emerald-900/20 hover:bg-emerald-900"
                      : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 shadow-[0_14px_40px_rgba(15,23,42,0.06)]",
                  ].join(" ")}
                >
                  {weekdayLabels[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Horarios de envio
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Cada horario envia una encuesta independiente; no es un rango.
              </p>
            </div>
            <button
              type="button"
              onClick={addTime}
              disabled={!canManage || isSubmitting || settings.reminderTimes.length >= 5}
              className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar horario
            </button>
          </div>

          {settings.reminderTimes.length === 0 ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-slate-500">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm leading-5">
                Sin horarios configurados. Agrega un horario para programar
                envios.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {settings.reminderTimes.map((time, index) => (
                <div key={`${time}-${index}`} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => updateTime(index, event.target.value)}
                    disabled={!canManage || isSubmitting}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => removeTime(index)}
                    disabled={!canManage || isSubmitting}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Eliminar horario"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            Enviar encuesta ahora
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Dispara una solicitud global de escucha para los colaboradores del
            negocio.
          </p>
          <button
            type="button"
            onClick={triggerSurvey}
            disabled={!canManage || isSubmitting || isTriggering}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Bell className="h-4 w-4" aria-hidden="true" />
            )}
            {isTriggering ? "Enviando..." : "Enviar ahora"}
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            {success}
          </p>
        ) : null}

        <button
          type="button"
          onClick={saveSettings}
          disabled={!canManage || isSubmitting || isTriggering}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Guardar horarios
        </button>
      </div>
    </section>
  );
}

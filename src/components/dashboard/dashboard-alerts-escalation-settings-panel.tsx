"use client";

import { Loader2, Mail, Phone, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { AlertEscalationSettings } from "@/domain/organizations/organization-settings-schemas";

type DashboardAlertsEscalationSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  initialSettings?: AlertEscalationSettings | null;
  canManage?: boolean;
  onSaved?: (settings: AlertEscalationSettings) => void;
};

function EscalationSettingsForm({
  initialSettings,
  canManage,
  onClose,
  onSaved,
}: {
  initialSettings?: AlertEscalationSettings | null;
  canManage: boolean;
  onClose: () => void;
  onSaved?: (settings: AlertEscalationSettings) => void;
}) {
  const [phone, setPhone] = useState(initialSettings?.alertEscalationPhone ?? "");
  const [email, setEmail] = useState(initialSettings?.alertEscalationEmail ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/organization/settings/alert-escalation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          alertEscalationPhone: phone,
          alertEscalationEmail: email,
        }),
      });

      const body = (await response.json()) as {
        settings?: AlertEscalationSettings;
        error?: string;
      };

      if (!response.ok || !body.settings) {
        setError(body.error ?? "No se pudo guardar la configuracion.");
        return;
      }

      setPhone(body.settings.alertEscalationPhone ?? "");
      setEmail(body.settings.alertEscalationEmail ?? "");
      onSaved?.(body.settings);
      setSuccess("Contacto de escalamiento guardado.");
      window.setTimeout(() => onClose(), 700);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
      className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar configuracion de escalamiento"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-escalation-settings-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Alertas y escalamiento
            </p>
            <h2
              id="alert-escalation-settings-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              Contacto de aviso
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Persona a quien se debe avisar cuando un caso sea critico o
              escalado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 py-6">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Telefono de escalamiento
              </span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={!canManage || isSubmitting}
                  placeholder="+504 0000-0000"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Correo de escalamiento
              </span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
                <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!canManage || isSubmitting}
                  type="email"
                  placeholder="gerencia@empresa.com"
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
                />
              </div>
            </label>

            {!canManage ? (
              <p className="text-sm leading-6 text-slate-500">
                Solo gerencia puede editar este contacto.
              </p>
            ) : null}
          </div>

          {success ? (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {canManage ? (
            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Guardando..." : "Guardar contacto"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          ) : null}
        </form>
      </aside>
    </div>
    </>
  );
}

export function DashboardAlertsEscalationSettingsPanel({
  open,
  onClose,
  initialSettings,
  canManage = false,
  onSaved,
}: DashboardAlertsEscalationSettingsPanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const formKey = [
    initialSettings?.alertEscalationPhone ?? "",
    initialSettings?.alertEscalationEmail ?? "",
  ].join(":");

  return (
    <EscalationSettingsForm
      key={formKey}
      initialSettings={initialSettings}
      canManage={canManage}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

"use client";

import {
  Building2,
  ClipboardList,
  Loader2,
  MessageSquareQuote,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import { PushNotificationsToggle } from "@/components/push/push-notifications-toggle";
import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

type DashboardOrganizationOperationalSettingsPanelProps = {
  initialSettings?: OrganizationSettings;
  canManage?: boolean;
  onSaved?: (settings: OrganizationSettings) => void;
};

function emptySettings(): OrganizationSettings {
  return {
    id: "",
    name: "",
    slug: "",
    logoUrl: null,
    tagline: null,
    description: null,
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    address: null,
    alertEscalationPhone: null,
    alertEscalationEmail: null,
    peakHours: null,
    servicePriorities: null,
    compensationPolicy: null,
    followUpTone: null,
    agentNotes: null,
    reportCadence: "monthly",
    createdAt: new Date(0).toISOString(),
  };
}

function OrganizationOperationalSettingsForm({
  initialSettings,
  canManage,
  onSaved,
}: {
  initialSettings: OrganizationSettings;
  canManage: boolean;
  onSaved?: (settings: OrganizationSettings) => void;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [peakHours, setPeakHours] = useState(initialSettings.peakHours ?? "");
  const [servicePriorities, setServicePriorities] = useState(
    initialSettings.servicePriorities ?? "",
  );
  const [compensationPolicy, setCompensationPolicy] = useState(
    initialSettings.compensationPolicy ?? "",
  );
  const [followUpTone, setFollowUpTone] = useState(initialSettings.followUpTone ?? "");
  const [agentNotes, setAgentNotes] = useState(initialSettings.agentNotes ?? "");
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
      const response = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: settings.name,
          tagline: settings.tagline,
          description: settings.description,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          websiteUrl: settings.websiteUrl,
          address: settings.address,
          logoUrl: settings.logoUrl,
          peakHours,
          servicePriorities,
          compensationPolicy,
          followUpTone,
          agentNotes,
        }),
      });

      const body = (await response.json()) as {
        settings?: OrganizationSettings;
        error?: string;
      };

      if (!response.ok || !body.settings) {
        setError(body.error ?? "No se pudo guardar la configuracion.");
        return;
      }

      setSettings(body.settings);
      onSaved?.(body.settings);
      setSuccess("Configuracion operativa guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-800">Operacion del negocio</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950">
          Contexto para analisis y seguimiento
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Reglas y prioridades que usa la plataforma para interpretar senales,
          priorizar alertas y orientar recomendaciones.
        </p>
      </div>

      <div className="space-y-6 p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Horarios pico</span>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Si lo dejas vacio, el sistema intentara detectarlos automaticamente.
            </p>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl bg-white px-4 py-3">
              <ClipboardList
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <textarea
                value={peakHours}
                onChange={(event) => setPeakHours(event.target.value)}
                disabled={!canManage}
                rows={3}
                placeholder="Ejemplo: viernes 5pm a 8pm y sabado 12pm a 3pm."
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Prioridades de servicio
            </span>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl bg-white px-4 py-3">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <textarea
                value={servicePriorities}
                onChange={(event) => setServicePriorities(event.target.value)}
                disabled={!canManage}
                rows={3}
                placeholder="Ejemplo: rapidez en caja, limpieza constante y trato cordial."
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Politica de compensacion
            </span>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl bg-white px-4 py-3">
              <Building2
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <textarea
                value={compensationPolicy}
                onChange={(event) => setCompensationPolicy(event.target.value)}
                disabled={!canManage}
                rows={4}
                placeholder="Ejemplo: si hubo espera excesiva, ofrecer disculpa, bebida o descuento segun criterio de gerencia."
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Tono de follow-up</span>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl bg-white px-4 py-3">
              <MessageSquareQuote
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <textarea
                value={followUpTone}
                onChange={(event) => setFollowUpTone(event.target.value)}
                disabled={!canManage}
                rows={3}
                placeholder="Ejemplo: cercano, respetuoso, breve y sin promesas que no podamos cumplir."
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Notas operativas para IA
            </span>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl bg-white px-4 py-3">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <textarea
                value={agentNotes}
                onChange={(event) => setAgentNotes(event.target.value)}
                disabled={!canManage}
                rows={3}
                placeholder="Ejemplo: no escalar automaticamente temas de precio; primero validar si fue promo mal comunicada."
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>
        </div>

        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {canManage ? (
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isSubmitting ? "Guardando..." : "Guardar configuracion"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Solo gerencia puede editar esta configuracion.
          </p>
        )}
      </div>
    </form>
  );
}

export function DashboardOrganizationOperationalSettingsPanel({
  initialSettings,
  canManage = false,
  onSaved,
}: DashboardOrganizationOperationalSettingsPanelProps) {
  const resolved = initialSettings ?? emptySettings();
  const formKey = [
    resolved.id,
    resolved.peakHours ?? "",
    resolved.servicePriorities ?? "",
    resolved.compensationPolicy ?? "",
    resolved.followUpTone ?? "",
    resolved.agentNotes ?? "",
  ].join(":");

  return (
    <div className="space-y-5">
      <section className="rounded-[1.25rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Notificaciones</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Push de este dispositivo
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Controla si este navegador recibe alertas fuera de la plataforma.
          </p>
        </div>
        <div className="p-5">
          <PushNotificationsToggle allowDisable />
        </div>
      </section>

      <OrganizationOperationalSettingsForm
        key={formKey}
        initialSettings={resolved}
        canManage={canManage}
        onSaved={onSaved}
      />
    </div>
  );
}

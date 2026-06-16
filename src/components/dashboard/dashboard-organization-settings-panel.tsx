"use client";

import {
  Building2,
  ClipboardList,
  Globe,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

type DashboardOrganizationSettingsPanelProps = {
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
    createdAt: new Date(0).toISOString(),
  };
}

function OrganizationSettingsForm({
  initialSettings,
  canManage,
  onSaved,
}: {
  initialSettings: OrganizationSettings;
  canManage: boolean;
  onSaved?: (settings: OrganizationSettings) => void;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [name, setName] = useState(initialSettings.name);
  const [tagline, setTagline] = useState(initialSettings.tagline ?? "");
  const [description, setDescription] = useState(initialSettings.description ?? "");
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialSettings.websiteUrl ?? "");
  const [address, setAddress] = useState(initialSettings.address ?? "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl ?? "");
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !canManage) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/organization/settings/logo", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const body = (await response.json()) as { logoUrl?: string; error?: string };

      if (!response.ok || !body.logoUrl) {
        setError(body.error ?? "No se pudo subir el logo.");
        return;
      }

      setLogoUrl(body.logoUrl);
      setSettings((current) => ({ ...current, logoUrl: body.logoUrl ?? null }));
      setSuccess("Logo actualizado.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

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
          name,
          tagline,
          description,
          contactEmail,
          contactPhone,
          websiteUrl,
          address,
          peakHours,
          servicePriorities,
          compensationPolicy,
          followUpTone,
          agentNotes,
          logoUrl: logoUrl || null,
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
      setSuccess("Informacion del negocio guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-800">Perfil del negocio</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950">
          Informacion visible de tu empresa
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Configura el nombre, logo y datos de contacto que quieras mostrar en la experiencia
          de Perks.
        </p>
      </div>

      <div className="space-y-6 p-5">
        <div className="rounded-xl border border-slate-100 bg-[#f7f8f4] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`Logo de ${name || settings.name}`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Building2 className="h-8 w-8 text-slate-300" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Logo del negocio</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                JPG, PNG, WEBP o SVG. Maximo 2 MB.
              </p>
              {canManage ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isUploadingLogo ? "Subiendo logo..." : "Subir logo"}
                  </button>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Solo gerencia puede editar esta informacion.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Nombre del negocio</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!canManage}
              required
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Eslogan</span>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              disabled={!canManage}
              placeholder="Una frase corta sobre tu negocio"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Descripcion</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canManage}
              rows={4}
              placeholder="Cuenta brevemente que hace tu negocio"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Correo de contacto</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
              <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                disabled={!canManage}
                type="email"
                placeholder="contacto@empresa.com"
                className="h-full w-full bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Telefono</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
              <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                disabled={!canManage}
                placeholder="+504 0000-0000"
                className="h-full w-full bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Sitio web</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
              <Globe className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                disabled={!canManage}
                placeholder="https://tuempresa.com"
                className="h-full w-full bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Direccion principal</span>
            <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={!canManage}
                rows={2}
                placeholder="Direccion general del negocio"
                className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none disabled:text-slate-500"
              />
            </div>
          </label>
        </div>

        <div className="rounded-[1.1rem] border border-slate-100 bg-[#f7f8f4] p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Contexto operativo del negocio
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Esta configuracion ayuda al sistema a interpretar mejor la
                operacion, priorizar senales y sugerir seguimiento con mas
                criterio del negocio.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Horarios pico
              </span>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Si lo dejas vacio, el agente intentara detectarlos automaticamente
                segun volumen y friccion por dia y hora.
              </p>
              <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
              <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
              <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
              <span className="text-sm font-semibold text-slate-700">
                Tono de follow-up
              </span>
              <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
              <div className="mt-2 flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
        </div>

        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {canManage ? (
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingLogo}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}

export function DashboardOrganizationSettingsPanel({
  initialSettings,
  canManage = false,
  onSaved,
}: DashboardOrganizationSettingsPanelProps) {
  const resolved = initialSettings ?? emptySettings();
  const formKey = [
    resolved.id,
    resolved.name,
    resolved.logoUrl ?? "",
    resolved.tagline ?? "",
    resolved.contactEmail ?? "",
    resolved.contactPhone ?? "",
    resolved.peakHours ?? "",
    resolved.servicePriorities ?? "",
  ].join(":");

  return (
    <OrganizationSettingsForm
      key={formKey}
      initialSettings={resolved}
      canManage={canManage}
      onSaved={onSaved}
    />
  );
}

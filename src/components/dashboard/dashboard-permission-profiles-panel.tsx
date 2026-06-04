"use client";

import {
  Bell,
  Building2,
  ChartNoAxesColumnIncreasing,
  Ear,
  Loader2,
  MessageSquareText,
  Plus,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  getPermissionLabels,
  platformPermissions,
  type PermissionKey,
  type PermissionProfile,
} from "@/domain/organizations/permission-profiles";

const permissionIcons = {
  summary: ChartNoAxesColumnIncreasing,
  comments: MessageSquareText,
  alerts: Bell,
  branches: Building2,
  team: UsersRound,
  settings: Settings2,
  listening: Ear,
} satisfies Record<PermissionKey, typeof ShieldCheck>;

type DashboardPermissionProfilesPanelProps = {
  profiles: PermissionProfile[];
  canManage?: boolean;
  onProfileCreated: (profile: PermissionProfile) => void;
};

export function DashboardPermissionProfilesPanel({
  profiles,
  canManage = false,
  onProfileCreated,
}: DashboardPermissionProfilesPanelProps) {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions],
  );

  function togglePermission(permission: PermissionKey) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Escribe un nombre para el rol.");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("Selecciona al menos un permiso.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/organization/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          permissions: selectedPermissions,
        }),
      });
      const body = (await response.json()) as {
        profile?: PermissionProfile;
        error?: string;
      };

      if (!response.ok || !body.profile) {
        setError(body.error ?? "No se pudo crear el rol.");
        return;
      }

      onProfileCreated(body.profile);
      setName("");
      setSelectedPermissions([]);
      setError("");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.25rem] border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Roles y permisos</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Crear rol operativo
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Define que secciones de la plataforma podra usar un rol y luego asignalo
            desde Equipo.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Nombre del rol
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!canManage || isSubmitting}
              placeholder="Ej. Gerente de tienda"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-700">
              Permisos de la plataforma
            </legend>
            <div className="grid gap-3">
              {platformPermissions.map((permission) => {
                const Icon = permissionIcons[permission.key];
                const isSelected = selectedPermissionSet.has(permission.key);

                return (
                  <label
                    key={permission.key}
                    className={[
                      "flex items-start gap-3 rounded-xl border px-4 py-3 transition",
                      isSelected
                        ? "border-slate-400 bg-white"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePermission(permission.key)}
                      disabled={!canManage || isSubmitting}
                      className="mt-1 size-4 rounded border-slate-300 accent-slate-900"
                      aria-label={permission.label}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        {permission.label}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-500">
                        {permission.description}
                      </span>
                    </span>
                    <span
                      className={[
                        "ml-auto mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-slate-300 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canManage || isSubmitting}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            Crear rol
          </button>
        </div>
      </form>

      <section className="rounded-[1.25rem] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Roles creados</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Lista para asignar en Equipo
          </h3>
        </div>

        <div className="space-y-3 p-5">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <article
                key={profile.id}
                className="rounded-xl border border-slate-100 bg-[#f7f8f4] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-950">
                      {profile.name}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {getPermissionLabels(profile.permissions).join(", ")}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Aun no hay roles creados
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Crea roles como gerente de tienda, experiencia o colaborador antes
                de asignarlos al equipo.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

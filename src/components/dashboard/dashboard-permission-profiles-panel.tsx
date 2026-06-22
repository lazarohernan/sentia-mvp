"use client";

import {
  Bell,
  Building2,
  ChartNoAxesColumnIncreasing,
  Ear,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  getPermissionLabels,
  inferMemberRoleFromPermissionProfile,
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
  onProfileUpdated: (profile: PermissionProfile) => void;
  onProfileDeleted: (profileId: string, affectedMemberCount: number) => void;
};

function buildDeleteConfirmMessage(profile: PermissionProfile) {
  const memberCount = profile.memberCount ?? 0;

  if (memberCount === 0) {
    return `¿Eliminar el rol «${profile.name}»? Esta acción no se puede deshacer.`;
  }

  const peopleLabel =
    memberCount === 1 ? "1 colaborador" : `${memberCount} colaboradores`;

  return [
    `Este rol está asignado a ${peopleLabel}.`,
    "Si lo eliminas, esas personas quedarán sin rol en el sistema.",
    "¿Deseas continuar?",
  ].join("\n\n");
}

function getInferredAccessLabel(permissions: PermissionKey[]) {
  const managerPermissions = new Set<PermissionKey>([
    "branches",
    "team",
    "settings",
  ]);

  return permissions.some((permission) => managerPermissions.has(permission))
    ? "Manager"
    : "Colaborador";
}

export function DashboardPermissionProfilesPanel({
  profiles,
  canManage = false,
  onProfileCreated,
  onProfileUpdated,
  onProfileDeleted,
}: DashboardPermissionProfilesPanelProps) {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions],
  );
  const isEditing = editingProfileId !== null;
  const inferredAccessLabel =
    selectedPermissions.length > 0
      ? getInferredAccessLabel(selectedPermissions)
      : "Sin definir";

  function resetForm() {
    setName("");
    setSelectedPermissions([]);
    setEditingProfileId(null);
    setError("");
  }

  function startEdit(profile: PermissionProfile) {
    setEditingProfileId(profile.id);
    setName(profile.name);
    setSelectedPermissions(profile.permissions);
    setError("");
  }

  function togglePermission(permission: PermissionKey) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  function applyCollaboratorTemplate() {
    setName((current) => current || "Colaborador escucha");
    setSelectedPermissions(["listening"]);
    setEditingProfileId(null);
    setError("");
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
    setError("");

    try {
      const response = await fetch(
        isEditing
          ? `/api/organization/roles/${editingProfileId}`
          : "/api/organization/roles",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            permissions: selectedPermissions,
          }),
        },
      );
      const body = (await response.json()) as {
        profile?: PermissionProfile;
        error?: string;
      };

      if (!response.ok || !body.profile) {
        setError(body.error ?? "No se pudo guardar el rol.");
        return;
      }

      if (isEditing) {
        onProfileUpdated(body.profile);
      } else {
        onProfileCreated(body.profile);
      }

      resetForm();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(profile: PermissionProfile) {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(buildDeleteConfirmMessage(profile));

    if (!confirmed) {
      return;
    }

    setDeletingProfileId(profile.id);
    setError("");

    try {
      const response = await fetch(`/api/organization/roles/${profile.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await response.json()) as {
        affectedMemberCount?: number;
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "No se pudo eliminar el rol.");
        return;
      }

      if (editingProfileId === profile.id) {
        resetForm();
      }

      onProfileDeleted(profile.id, body.affectedMemberCount ?? profile.memberCount ?? 0);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setDeletingProfileId(null);
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
            {isEditing ? "Editar rol operativo" : "Crear rol operativo"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isEditing
              ? "Actualiza el nombre o los permisos. Los colaboradores asignados conservan el rol, con permisos actualizados."
              : "Define que secciones de la plataforma podra usar un rol y luego asignalo desde Equipo."}
          </p>
        </div>

        <div className="space-y-5 p-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nombre del rol</span>
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Plantilla recomendada para colaboradores
                  </p>
                  <p className="mt-1 text-sm leading-5 text-emerald-900/80">
                    Crea un perfil con solo Escucha. Ese perfil entra al portal
                    de colaborador y no ve gestión administrativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyCollaboratorTemplate}
                  disabled={!canManage || isSubmitting}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Usar Colaborador
                </button>
              </div>
            </div>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">
              Tipo de acceso resultante
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {inferredAccessLabel}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Los permisos Sucursales, Equipo o Configuracion convierten el rol
              en Manager. Sin esos permisos, el rol queda como Colaborador.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canManage || isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isEditing ? (
                <Pencil className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear rol"}
            </button>
            {isEditing ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={resetForm}
                className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
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
            profiles.map((profile) => {
              const memberCount = profile.memberCount ?? 0;
              const isDeleting = deletingProfileId === profile.id;
              const isBeingEdited = editingProfileId === profile.id;

              return (
                <article
                  key={profile.id}
                  className={[
                    "relative rounded-xl border p-4",
                    canManage ? "pr-14" : "",
                    isBeingEdited
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-100 bg-[#f7f8f4]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-950">
                          {profile.name}
                        </h4>
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                            inferMemberRoleFromPermissionProfile(profile) === "collaborator"
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                              : "bg-blue-50 text-blue-800 ring-blue-100",
                          ].join(" ")}
                        >
                          {inferMemberRoleFromPermissionProfile(profile) === "collaborator"
                            ? "Acceso colaborador"
                            : "Acceso manager"}
                        </span>
                        {memberCount > 0 ? (
                          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {memberCount === 1
                              ? "1 colaborador"
                              : `${memberCount} colaboradores`}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                            Sin asignar
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {getPermissionLabels(profile.permissions).join(", ")}
                      </p>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="absolute right-3 top-3 flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={isSubmitting || isDeleting}
                        onClick={() => startEdit(profile)}
                        aria-label={`Editar rol ${profile.name}`}
                        title="Editar"
                        className={[
                          "inline-flex size-8 items-center justify-center rounded-lg border bg-white transition disabled:cursor-not-allowed disabled:opacity-60",
                          isBeingEdited
                            ? "border-emerald-300 text-emerald-800"
                            : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900",
                        ].join(" ")}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || isDeleting}
                        onClick={() => {
                          void handleDelete(profile);
                        }}
                        aria-label={`Eliminar rol ${profile.name}`}
                        title="Eliminar"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })
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

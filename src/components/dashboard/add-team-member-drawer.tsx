"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import type { Branch } from "@/domain/branches/schemas";
import {
  inferMemberRoleFromPermissionProfile,
  type PermissionProfile,
} from "@/domain/organizations/permission-profiles";
import type { TeamMember } from "@/domain/organizations/team";

type AddTeamMemberDrawerProps = {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  actorRole: "owner" | "manager";
  permissionProfiles?: PermissionProfile[];
  onSaved: (member: TeamMember) => void;
};

type SuccessState = {
  memberName: string;
  email: string;
  inviteEmailStatus?: "sent" | "skipped" | null;
};

export function AddTeamMemberDrawer({
  open,
  onClose,
  branches,
  actorRole,
  permissionProfiles = [],
  onSaved,
}: AddTeamMemberDrawerProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [permissionProfileId, setPermissionProfileId] = useState("");
  const [participatesInListening, setParticipatesInListening] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  function resetForm() {
    setFullName("");
    setEmail("");
    setBranchId("");
    setPermissionProfileId("");
    setParticipatesInListening(false);
    setError("");
    setSuccess(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const selectedPermissionProfile =
        assignablePermissionProfiles.find((profile) => profile.id === permissionProfileId) ??
        null;

      if (!selectedPermissionProfile && !participatesInListening) {
        setError(
          "Asigna un rol de plataforma o activa la participación en Escucha.",
        );
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/team-members", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          role: selectedPermissionProfile
            ? inferMemberRoleFromPermissionProfile(selectedPermissionProfile)
            : "collaborator",
          organizationRoleId: selectedPermissionProfile?.id ?? null,
          participatesInListening,
          branchId: branchId || undefined,
        }),
      });

      const body = (await response.json()) as {
        member?: TeamMember;
        inviteLink?: string | null;
        inviteEmailStatus?: "sent" | "skipped" | null;
        error?: string;
      };

      if (!response.ok || !body.member) {
        setError(body.error ?? "No se pudo agregar al colaborador.");
        return;
      }

      const memberWithProfile = {
        ...body.member,
        permissionProfileId: selectedPermissionProfile?.id ?? null,
        permissionProfileName: selectedPermissionProfile?.name ?? null,
        participatesInListening,
      };

      onSaved(memberWithProfile);
      setSuccess({
        memberName: memberWithProfile.fullName,
        email,
        inviteEmailStatus: body.inviteEmailStatus ?? null,
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  const assignablePermissionProfiles = permissionProfiles.filter((profile) => {
    if (actorRole === "owner") {
      return true;
    }

    return inferMemberRoleFromPermissionProfile(profile) === "collaborator";
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar drawer"
        onClick={handleClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-team-member-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Nuevo colaborador</p>
            <h2 id="add-team-member-title" className="mt-1 text-xl font-semibold text-slate-950">
              {success ? "Colaborador agregado" : "Agregar al equipo"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col px-6 py-6">
            <p className="text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-950">{success.memberName}</span> ya
              forma parte del equipo.
            </p>

            {success.inviteEmailStatus === "sent" ? (
              <div className="mt-5 rounded-lg bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-emerald-950">
                  Invitación enviada
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                  Enviamos el correo de activación a{" "}
                  <span className="font-semibold">{success.email}</span>. La persona podrá crear
                  su contraseña desde ese mensaje.
                </p>
              </div>
            ) : success.inviteEmailStatus === "skipped" ? (
              <div className="mt-5 rounded-lg border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900">
                El colaborador fue agregado, pero el correo no se envió porque Resend no está
                configurado en este entorno.
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Esta persona ya tenía cuenta. Puede entrar en{" "}
                <span className="font-semibold text-slate-900">/login</span>.
              </div>
            )}

            <div className="mt-auto flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Nombre completo</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Ej. Ana Lopez"
                  className="field-control mt-2 h-12 w-full rounded-lg bg-white px-4 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Correo electronico</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="colaborador@empresa.com"
                  className="field-control mt-2 h-12 w-full rounded-lg bg-white px-4 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Sucursal</span>
                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className="field-control mt-2 h-12 w-full rounded-lg bg-white px-4 text-sm"
                >
                  <option value="">Sin sucursal asignada</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="border border-slate-200 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Participa en Escucha
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">
                      Si solo activas esto, no necesita rol. Entra al portal para
                      evaluarse.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={participatesInListening}
                    aria-label="Participa en Escucha"
                    onClick={() =>
                      setParticipatesInListening((current) => !current)
                    }
                    className={[
                      "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
                      participatesInListening ? "bg-emerald-800" : "bg-slate-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 size-5 rounded-full bg-white transition",
                        participatesInListening ? "left-5" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-900">
                  Rol de plataforma
                </span>
                <select
                  aria-label="Rol"
                  value={permissionProfileId}
                  onChange={(event) => setPermissionProfileId(event.target.value)}
                  className="field-control mt-2 h-12 w-full rounded-lg bg-white px-4 text-sm text-slate-900"
                >
                  <option value="">Sin acceso a la plataforma</option>
                  {assignablePermissionProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-sm leading-6 text-slate-700">
                  Opcional. Solo si también debe ver el dashboard.
                </span>
              </label>

              <p className="text-sm leading-6 text-slate-700">
                Generaremos un enlace de activación para el colaborador.
              </p>

              {error ? (
                <p className="rounded-lg border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Agregar colaborador
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

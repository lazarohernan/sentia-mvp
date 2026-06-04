"use client";

import { Check, Copy, Loader2, Mail, Plus, X } from "lucide-react";
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
  inviteLink: string | null;
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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setBranchId("");
    setPermissionProfileId("");
    setError("");
    setSuccess(null);
    setCopied(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleCopyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const selectedPermissionProfile =
        assignablePermissionProfiles.find((profile) => profile.id === permissionProfileId) ??
        null;

      const response = await fetch("/api/team-members", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          role: inferMemberRoleFromPermissionProfile(selectedPermissionProfile),
          organizationRoleId: selectedPermissionProfile?.id ?? null,
          branchId: branchId || undefined,
        }),
      });

      const body = (await response.json()) as {
        member?: TeamMember;
        inviteLink?: string | null;
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
      };

      onSaved(memberWithProfile);
      setSuccess({
        memberName: memberWithProfile.fullName,
        email,
        inviteLink: body.inviteLink ?? null,
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

  const emailInviteHref =
    success?.inviteLink && success.email
      ? [
          `mailto:${encodeURIComponent(success.email)}`,
          `?subject=${encodeURIComponent("Activa tu acceso a Perks")}`,
          `&body=${encodeURIComponent(
            `Hola ${success.memberName},\n\nTe comparto tu enlace para activar tu cuenta en Perks. Abre este enlace, confirma tu nombre y crea tu contraseña:\n\n${success.inviteLink}\n\nDespués podrás entrar desde /login.`,
          )}`,
        ].join("")
      : "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar drawer"
        onClick={handleClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
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
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
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

            {success.inviteLink ? (
              <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-emerald-950">
                  Enlace de activacion
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                  Compartelo por WhatsApp o correo. El colaborador abrira activacion de
                  cuenta desde este enlace.
                </p>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-white p-3">
                  <p className="min-w-0 flex-1 break-all text-xs text-slate-600">
                    {success.inviteLink}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(success.inviteLink!)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <a
                  href={emailInviteHref}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Enviar por correo
                </a>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Esta persona ya tenia cuenta. Puede entrar en{" "}
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
                <span className="text-sm font-semibold text-slate-700">Nombre completo</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Ej. Ana Lopez"
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Correo electronico</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="colaborador@empresa.com"
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Sucursal</span>
                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Sin sucursal asignada</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Rol</span>
                <select
                  aria-label="Rol"
                  value={permissionProfileId}
                  onChange={(event) => setPermissionProfileId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Sin rol asignado</option>
                  {assignablePermissionProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  Los roles se crean en Gestion &gt; Permisos y definen que puede ver
                  cada persona.
                </span>
              </label>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">
                Generaremos un enlace de activacion para compartir con el colaborador.
              </div>

              {error ? (
                <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700"
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

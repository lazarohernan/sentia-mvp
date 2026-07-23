"use client";

import { ArrowLeft, Loader2, Mail, MapPin, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { formatTableDate } from "@/domain/feedback/record-analysis";
import { canRemoveTeamMember } from "@/domain/organizations/remove-team-member";
import {
  getPermissionLabels,
  inferMemberRoleFromPermissionProfile,
  type PermissionProfile,
} from "@/domain/organizations/permission-profiles";
import type { TeamMember } from "@/domain/organizations/team";

type TeamMemberDetailViewProps = {
  member: TeamMember;
  canManageTeam: boolean;
  actorRole?: "owner" | "manager";
  currentUserId?: string;
  permissionProfiles?: PermissionProfile[];
  onBack: () => void;
  onMemberUpdated: (member: TeamMember) => void;
  onMemberRemoved: (userId: string) => void;
};

const statusStyles = {
  active: "text-emerald-700",
  pending_activation: "text-amber-700",
} as const;

const statusLabels = {
  active: "Activo",
  pending_activation: "Pendiente de activacion",
} as const;

function formatCooldown(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "1 minuto" : `${minutes} minutos`;
}

export function TeamMemberDetailView({
  member,
  canManageTeam,
  actorRole,
  currentUserId,
  permissionProfiles = [],
  onBack,
  onMemberUpdated,
  onMemberRemoved,
}: TeamMemberDetailViewProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const selectedProfile =
    permissionProfiles.find((profile) => profile.id === member.permissionProfileId) ??
    null;
  const assignablePermissionProfiles = permissionProfiles.filter((profile) => {
    if (actorRole === "owner") {
      return true;
    }

    return inferMemberRoleFromPermissionProfile(profile) === "collaborator";
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleResendInvite() {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/team-members/${member.userId}/resend-invite`, {
        method: "POST",
        credentials: "same-origin",
      });

      const body = (await response.json()) as {
        inviteLink?: string;
        accountStatus?: TeamMember["accountStatus"];
        inviteEmailStatus?: "sent" | "skipped";
        error?: string;
        retryAfterSeconds?: number;
      };

      if (response.status === 429 && body.retryAfterSeconds) {
        setCooldownSeconds(body.retryAfterSeconds);
        setError(body.error ?? "Debes esperar antes de reenviar.");
        return;
      }

      if (!response.ok) {
        setError(body.error ?? "No se pudo reenviar la invitacion.");
        return;
      }

      setSuccess(
        body.inviteEmailStatus === "sent"
          ? "Invitación reenviada por correo."
          : "Invitación generada, pero el correo no se envió porque Resend no está configurado.",
      );
      setCooldownSeconds(10 * 60);
      onMemberUpdated({
        ...member,
        accountStatus: body.accountStatus ?? "pending_activation",
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function patchMemberAccess(payload: {
    organizationRoleId?: string | null;
    participatesInListening?: boolean;
  }) {
    setRoleError("");
    setIsRoleSaving(true);

    try {
      const response = await fetch(`/api/team-members/${member.userId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        permissionProfileId?: string | null;
        permissionProfileName?: string | null;
        role?: TeamMember["role"];
        participatesInListening?: boolean;
        error?: string;
      };

      if (!response.ok || !body.role) {
        setRoleError(body.error ?? "No se pudo actualizar el acceso.");
        return;
      }

      onMemberUpdated({
        ...member,
        role: body.role,
        roleLabel:
          body.role === "manager"
            ? "Gerente"
            : body.role === "collaborator"
              ? "Colaborador"
              : member.roleLabel,
        permissionProfileId: body.permissionProfileId ?? null,
        permissionProfileName: body.permissionProfileName ?? null,
        participatesInListening:
          body.participatesInListening ?? member.participatesInListening,
      });
    } catch {
      setRoleError("No se pudo conectar con el servidor.");
    } finally {
      setIsRoleSaving(false);
    }
  }

  async function handlePermissionProfileChange(profileId: string) {
    const profile = permissionProfiles.find((item) => item.id === profileId) ?? null;
    await patchMemberAccess({
      organizationRoleId: profile?.id ?? null,
    });
  }

  async function handleListeningToggle() {
    await patchMemberAccess({
      participatesInListening: !member.participatesInListening,
    });
  }

  const canResend =
    canManageTeam &&
    member.accountStatus === "pending_activation" &&
    cooldownSeconds === 0 &&
    !isSubmitting;

  const canDelete =
    canManageTeam &&
    actorRole &&
    currentUserId !== member.userId &&
    canRemoveTeamMember(actorRole, member.role);

  async function handleDeleteMember() {
    setDeleteError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/team-members/${member.userId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDeleteError(body.error ?? "No se pudo eliminar al colaborador.");
        return;
      }

      onMemberRemoved(member.userId);
    } catch {
      setDeleteError("No se pudo conectar con el servidor.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-[1.25rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-50"
          aria-label="Volver al equipo"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Detalle del colaborador</p>
          <h2 className="text-xl font-semibold text-slate-950">{member.fullName}</h2>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f7f8f4] p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Rol
            </dt>
            <dd className="mt-2 text-sm font-semibold text-slate-900">
              {member.permissionProfileName ?? member.roleLabel}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f4] p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Estado
            </dt>
            <dd className="mt-2">
              <span
                className={[
                  "text-sm font-semibold",
                  statusStyles[member.accountStatus],
                ].join(" ")}
              >
                {statusLabels[member.accountStatus]}
              </span>
            </dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f4] p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Correo
            </dt>
            <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
              <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {member.email ?? "No disponible"}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f4] p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Sucursal
            </dt>
            <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {member.branchName ?? "Sin sucursal asignada"}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f4] p-4 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              En el equipo desde
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {formatTableDate(member.joinedAt)}
            </dd>
          </div>
        </dl>

        {canManageTeam ? (
          <section className="space-y-4 border border-slate-200 p-4">
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
                aria-checked={member.participatesInListening}
                aria-label="Participa en Escucha"
                disabled={isRoleSaving}
                onClick={() => void handleListeningToggle()}
                className={[
                  "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
                  member.participatesInListening ? "bg-emerald-800" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 size-5 rounded-full bg-white transition",
                    member.participatesInListening ? "left-5" : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>

            <label className="block border-t border-slate-200 pt-4">
              <span className="text-sm font-semibold text-slate-900">
                Rol de plataforma
              </span>
              <select
                value={member.permissionProfileId ?? ""}
                onChange={(event) => handlePermissionProfileChange(event.target.value)}
                disabled={isRoleSaving}
                aria-label="Rol"
                className="field-control mt-2 h-11 w-full bg-white px-3 text-sm font-medium text-slate-800"
              >
                <option value="">Sin acceso a la plataforma</option>
                {assignablePermissionProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedProfile ? (
              <p className="text-sm leading-6 text-slate-700">
                Permisos: {getPermissionLabels(selectedProfile.permissions).join(", ")}
              </p>
            ) : (
              <p className="text-sm leading-6 text-slate-700">
                Opcional. Solo si también debe ver el dashboard.
              </p>
            )}

            {roleError ? (
              <p className="text-sm text-red-700">{roleError}</p>
            ) : null}
          </section>
        ) : null}

        {member.accountStatus === "pending_activation" && canManageTeam ? (
          <div className="rounded-xl bg-amber-50/70 p-4">
            <p className="text-sm font-semibold text-amber-950">Activacion pendiente</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">
              Este colaborador aún no entra por primera vez. Puedes reenviar la invitación por
              correo para que cree su contraseña.
            </p>

            {success ? (
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-emerald-800">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700">
                {error}
                {cooldownSeconds > 0 ? ` Podras reenviar en ${formatCooldown(cooldownSeconds)}.` : ""}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleResendInvite}
              disabled={!canResend}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {cooldownSeconds > 0
                ? `Reenviar en ${formatCooldown(cooldownSeconds)}`
                : "Reenviar invitacion"}
            </button>
          </div>
        ) : null}

        {canDelete ? (
          <div className="rounded-xl bg-red-50/60 p-4">
            <p className="text-sm font-semibold text-red-950">Zona de riesgo</p>
            <p className="mt-1 text-sm leading-6 text-red-900/80">
              Al eliminar a {member.fullName}, perdera acceso a la organizacion. Esta accion no se
              puede deshacer.
            </p>

            {deleteError ? (
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setDeleteError("");
                setShowDeleteConfirm(true);
              }}
              disabled={isDeleting}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar colaborador
            </button>
          </div>
        ) : null}
      </div>

      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Cerrar advertencia"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteConfirm(false);
              }
            }}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-member-title"
            aria-describedby="delete-member-description"
            className="relative w-full max-w-md rounded-[1.25rem] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold text-red-700">Advertencia</p>
            <h3 id="delete-member-title" className="mt-2 text-xl font-semibold text-slate-950">
              ¿Eliminar a {member.fullName}?
            </h3>
            <p id="delete-member-description" className="mt-3 text-sm leading-6 text-slate-600">
              Esta persona dejara de pertenecer al equipo y no podra acceder al panel. Los registros
              historicos se conservan, pero perdera acceso inmediato.
            </p>

            {deleteError ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                Si, eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

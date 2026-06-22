"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import { getAlertSourceLabel } from "@/domain/dashboard/alerts";
import type { WorkflowStatus } from "@/domain/feedback/workflow-status";
import { workflowStatusToLabel } from "@/domain/feedback/workflow-status";
import type { TeamMember } from "@/domain/organizations/team";

type DashboardAlertCardProps = {
  alert: DashboardAlertItem;
  assignees: TeamMember[];
  canManage: boolean;
  onOpenSubmission?: (submissionId: string) => void;
  onUpdated: (alertId: string, next: Partial<DashboardAlertItem>) => void;
  onRemoved: (alertId: string) => void;
};

const statusOptions: Array<{ value: WorkflowStatus; label: string }> = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_revision", label: "En revisión" },
  { value: "en_proceso", label: "En proceso" },
  { value: "escalado", label: "Escalado" },
  { value: "resuelto", label: "Resuelto" },
];

function priorityToneClasses(tone: DashboardAlertItem["tone"]) {
  if (tone === "danger") {
    return "border-red-200/70 bg-white";
  }

  if (tone === "warning") {
    return "border-amber-200/70 bg-white";
  }

  return "border-slate-200 bg-white";
}

export function DashboardAlertCard({
  alert,
  assignees,
  canManage,
  onOpenSubmission,
  onUpdated,
  onRemoved,
}: DashboardAlertCardProps) {
  const [status, setStatus] = useState<WorkflowStatus>(
    alert.workflowStatus ?? "nuevo",
  );
  const [assignedUserId, setAssignedUserId] = useState(
    alert.assignedUserId ?? "",
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isActionable = Boolean(alert.submissionId) && canManage;

  async function handleSave() {
    if (!alert.submissionId || !isActionable) {
      return;
    }

    const hasStatusChange = status !== (alert.workflowStatus ?? "nuevo");
    const hasAssignmentChange = assignedUserId !== (alert.assignedUserId ?? "");
    const trimmedNote = note.trim();

    if (!hasStatusChange && !hasAssignmentChange && !trimmedNote) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/feedback/${alert.submissionId}/follow-up`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(hasStatusChange ? { status } : {}),
          ...(hasAssignmentChange ? { assignedUserId: assignedUserId || null } : {}),
          ...(trimmedNote ? { note: trimmedNote } : {}),
        }),
      });
      const body = (await response.json()) as {
        workflowStatus?: WorkflowStatus;
        escalationEmailStatus?: "sent" | "skipped" | null;
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "No se pudo guardar el seguimiento.");
        return;
      }

      const nextStatus = body.workflowStatus ?? status;
      const assignee = assignees.find((member) => member.userId === assignedUserId);

      if (nextStatus === "resuelto") {
        onRemoved(alert.id);
      } else {
        onUpdated(alert.id, {
          workflowStatus: nextStatus,
          assignedUserId: assignedUserId || null,
          assignedUserName: assignee?.fullName,
          slaBreached: false,
        });
      }

      setNote("");
      setMessage(
        body.escalationEmailStatus === "sent"
          ? "Guardado. Se envió aviso por correo."
          : "Seguimiento actualizado.",
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={`rounded-2xl border p-4 ${priorityToneClasses(alert.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
              {getAlertSourceLabel(alert.source)}
            </span>
            {alert.slaBreached ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
                SLA vencido
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{alert.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{alert.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {alert.workflowStatus
            ? workflowStatusToLabel(alert.workflowStatus)
            : alert.priority}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{alert.detail}</p>

      {alert.probableCause ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {alert.probableCause}
        </p>
      ) : null}

      {isActionable ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Estado</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as WorkflowStatus)}
                className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Responsable</span>
              <select
                value={assignedUserId}
                onChange={(event) => setAssignedUserId(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
              >
                <option value="">Sin asignar</option>
                {assignees.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Nota</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Breve nota de seguimiento"
              className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700/10"
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-700">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm font-medium text-emerald-800">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Guardar
            </button>
            {onOpenSubmission && alert.submissionId ? (
              <button
                type="button"
                onClick={() => onOpenSubmission(alert.submissionId!)}
                className="inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver valoración
              </button>
            ) : null}
          </div>
        </div>
      ) : onOpenSubmission && alert.submissionId ? (
        <button
          type="button"
          onClick={() => onOpenSubmission(alert.submissionId!)}
          className="mt-4 inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver valoración
        </button>
      ) : null}
    </article>
  );
}

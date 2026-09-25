"use client";

/* Linear-style issue card · Perks tokens
 * states: default · hover · focus · active · disabled · loading · error · success
 */

import { Loader2 } from "lucide-react";
import { useState } from "react";

import {
  getAlertSourceLabel,
  type DashboardAlertItem,
} from "@/domain/dashboard/alerts";
import type { WorkflowStatus } from "@/domain/feedback/workflow-status";
import { workflowStatusToLabel } from "@/domain/feedback/workflow-status";
import type { TeamMember } from "@/domain/organizations/team";

import { SlaTerm } from "./sla-term";

type DashboardAlertCardProps = {
  alert: DashboardAlertItem;
  assignees: TeamMember[];
  canManage: boolean;
  demoMode?: boolean;
  onOpenSubmission?: (submissionId: string) => void;
  onUpdated: (alertId: string, next: Partial<DashboardAlertItem>) => void;
  onRemoved: (alertId: string) => void;
};

function workflowStatusClass(status: WorkflowStatus | undefined) {
  if (status === "en_revision") {
    return "bg-signal-warning-paper text-signal-warning-ink";
  }
  if (status === "en_proceso") {
    return "bg-brand-soft text-brand-muted";
  }
  if (status === "escalado") {
    return "bg-signal-danger-paper text-signal-danger-ink";
  }
  if (status === "resuelto") {
    return "bg-signal-ok-paper text-signal-ok-ink";
  }
  return "bg-surface-muted text-text-secondary";
}

function toneMarkClass(tone: DashboardAlertItem["tone"]) {
  if (tone === "danger") return "bg-signal-danger-fill";
  if (tone === "warning") return "bg-signal-warning-fill";
  return "bg-signal-ok-fill";
}

const statusOptions: Array<{ value: WorkflowStatus; label: string }> = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_revision", label: "En revisión" },
  { value: "en_proceso", label: "En proceso" },
  { value: "escalado", label: "Escalado" },
  { value: "resuelto", label: "Resuelto" },
];

export function DashboardAlertCard({
  alert,
  assignees,
  canManage,
  demoMode = false,
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
      if (demoMode) {
        const assignee = assignees.find((member) => member.userId === assignedUserId);
        if (status === "resuelto") {
          onRemoved(alert.id);
        } else {
          onUpdated(alert.id, {
            workflowStatus: status,
            assignedUserId: assignedUserId || null,
            assignedUserName: assignee?.fullName,
            slaBreached: false,
          });
        }
        setNote("");
        setMessage(
          trimmedNote
            ? "Seguimiento actualizado en la demo."
            : "Seguimiento actualizado en la demo.",
        );
        return;
      }

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
    <article className="min-w-0 rounded-panel bg-surface p-4 transition-colors hover:bg-surface-muted ">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`size-1.5 shrink-0 rounded-full ${toneMarkClass(alert.tone)}`}
              aria-hidden="true"
            />
            <span className="text-[13px] text-text-secondary">
              {getAlertSourceLabel(alert.source)}
            </span>
            {alert.slaBreached ? <SlaTerm variant="badge" /> : null}
          </div>
          <h3 className="mt-2 min-w-0 wrap-anywhere text-sm font-medium leading-5 text-text-primary">
            {alert.title}
          </h3>
          <p className="mt-1 text-[13px] leading-5 text-text-secondary">
            {alert.subtitle}
          </p>
        </div>
        <span
          className={[
            "inline-flex h-6 shrink-0 items-center rounded-md px-2 text-[12px] font-medium",
            workflowStatusClass(alert.workflowStatus),
          ].join(" ")}
        >
          {alert.workflowStatus
            ? workflowStatusToLabel(alert.workflowStatus)
            : alert.priority}
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-5 text-text-secondary">
        {alert.detail}
      </p>

      {alert.probableCause ? (
        <p className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-[13px] leading-5 text-text-secondary">
          <span className="font-medium text-text-primary">Causa probable. </span>
          {alert.probableCause}
        </p>
      ) : null}

      {isActionable ? (
        <div className="mt-4 space-y-2.5 border-t border-border-soft pt-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-medium text-text-secondary">
                Estado
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as WorkflowStatus)}
                className="field-control mt-1 h-9 w-full rounded-md bg-surface px-2.5 text-[13px] text-text-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-text-secondary">
                Responsable
              </span>
              <select
                value={assignedUserId}
                onChange={(event) => setAssignedUserId(event.target.value)}
                className="field-control mt-1 h-9 w-full rounded-md bg-surface px-2.5 text-[13px] text-text-primary"
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
            <span className="text-[12px] font-medium text-text-secondary">
              Nota
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Breve nota de seguimiento"
              className="field-control mt-1 h-9 w-full rounded-md bg-surface px-2.5 text-[13px] text-text-primary placeholder:text-text-secondary"
            />
          </label>
          {error ? (
            <p className="text-[13px] font-medium text-signal-danger-ink" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-[13px] font-medium text-brand-muted" role="status">
              {message}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-muted px-3 text-[13px] font-medium text-text-inverse transition hover:bg-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            {onOpenSubmission && alert.submissionId ? (
              <button
                type="button"
                onClick={() => onOpenSubmission(alert.submissionId!)}
                className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
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
          className="mt-3 inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
        >
          Ver valoración
        </button>
      ) : null}
    </article>
  );
}

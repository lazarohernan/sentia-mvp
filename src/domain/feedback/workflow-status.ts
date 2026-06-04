export const workflowStatusValues = [
  "nuevo",
  "en_revision",
  "en_proceso",
  "resuelto",
  "escalado",
] as const;

export type WorkflowStatus = (typeof workflowStatusValues)[number];

export type CommentWorkflowLabel =
  | "Nuevo"
  | "En revisión"
  | "En proceso"
  | "Resuelto"
  | "Escalado";

const labelByStatus: Record<WorkflowStatus, CommentWorkflowLabel> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
  escalado: "Escalado",
};

const statusByLabel: Record<CommentWorkflowLabel, WorkflowStatus> = {
  Nuevo: "nuevo",
  "En revisión": "en_revision",
  "En proceso": "en_proceso",
  Resuelto: "resuelto",
  Escalado: "escalado",
};

export function workflowStatusToLabel(status: WorkflowStatus): CommentWorkflowLabel {
  return labelByStatus[status];
}

export function labelToWorkflowStatus(label: string): WorkflowStatus | null {
  if (label === "En revision") {
    return "en_revision";
  }

  const normalized = label as CommentWorkflowLabel;
  return statusByLabel[normalized] ?? null;
}

export function isWorkflowStatus(value: string): value is WorkflowStatus {
  return workflowStatusValues.includes(value as WorkflowStatus);
}

export function isOpenWorkflowStatus(status: WorkflowStatus): boolean {
  return status !== "resuelto";
}

export function inferWorkflowStatusFromSignals(params: {
  urgency: "low" | "medium" | "high" | "critical" | null;
  tone: "success" | "warning" | "danger";
}): WorkflowStatus {
  if (params.urgency === "critical") {
    return "escalado";
  }

  if (params.urgency === "high" || params.tone === "danger") {
    return "en_revision";
  }

  return "nuevo";
}

import {
  inferWorkflowStatusFromSignals,
  isWorkflowStatus,
  workflowStatusToLabel,
  type WorkflowStatus,
} from "./workflow-status";

export type FeedbackRecord = {
  id: string;
  type: string;
  emotion_score: number;
  csat_score: number | null;
  free_text: string;
  contact_name: string | null;
  workflow_status?: WorkflowStatus | string | null;
  assigned_user_id?: string | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  branch_id: string;
  branches: {
    id: string;
    name: string;
    slug: string;
    organization_id: string;
  } | null;
  ai_analyses:
    | Array<{
        status: string;
        sentiment: "positive" | "neutral" | "negative" | null;
        urgency: "low" | "medium" | "high" | "critical" | null;
        category: string | null;
        summary: string | null;
        probable_cause: string | null;
        recommended_action: string | null;
        suggested_owner: string | null;
        suggested_sla: string | null;
        requires_contact: boolean | null;
        information_quality: "sufficient" | "partial" | "insufficient" | null;
        follow_up_question: string | null;
        follow_up_answer: string | null;
        model_used: string | null;
        confidence: number | null;
      }>
    | null;
};

export function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days} d`;
}

export function formatTableDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getAnalysis(record: FeedbackRecord) {
  return record.ai_analyses?.[0] ?? null;
}

export function getTone(record: FeedbackRecord): "success" | "warning" | "danger" {
  const analysis = getAnalysis(record);

  if (
    analysis?.sentiment === "negative" ||
    analysis?.urgency === "high" ||
    analysis?.urgency === "critical" ||
    (record.csat_score !== null && record.csat_score <= 2)
  ) {
    return "danger";
  }

  if (analysis?.sentiment === "positive" || (record.csat_score ?? 0) >= 4) {
    return "success";
  }

  return "warning";
}

export function getSentiment(record: FeedbackRecord): "Positivo" | "Neutral" | "Riesgo" {
  const tone = getTone(record);
  if (tone === "danger") return "Riesgo";
  if (tone === "success") return "Positivo";
  return "Neutral";
}

export function getFeedbackTypeLabel(
  type: string,
): "Opinión" | "Queja" | "Observación" | "Felicitación" | "Recomendación" {
  if (type === "complaint") return "Queja";
  if (type === "suggestion" || type === "observation") return "Observación";
  if (type === "compliment") return "Felicitación";
  if (type === "recommendation") return "Recomendación";

  return "Opinión";
}

export function getStatus(
  record: FeedbackRecord,
): "Nuevo" | "En revisión" | "En proceso" | "Resuelto" | "Escalado" {
  if (record.workflow_status && isWorkflowStatus(record.workflow_status)) {
    return workflowStatusToLabel(record.workflow_status);
  }

  const analysis = getAnalysis(record);
  return workflowStatusToLabel(
    inferWorkflowStatusFromSignals({
      urgency: analysis?.urgency ?? null,
      tone: getTone(record),
    }),
  );
}

const DEMO_SEED_MARKER_PATTERN = /\s*\[DEMO-SEED-[^\]]+\]\s*/g;

export function sanitizeFeedbackText(text: string) {
  return text.replace(DEMO_SEED_MARKER_PATTERN, " ").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 3).trim()}...`;
}

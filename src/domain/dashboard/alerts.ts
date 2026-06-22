import type { DashboardAttentionItem, DashboardNotification } from "./schemas";
import { isSlaBreached, getHoursOpen } from "./alert-sla";
import type { WorkflowStatus } from "@/domain/feedback/workflow-status";

export type DashboardAlertSource = "ia" | "notificacion";

export type DashboardAlertItem = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  priority: string;
  owner?: string;
  probableCause?: string;
  suggestedSla?: string;
  requiresContact?: boolean;
  tone: "success" | "warning" | "danger";
  unread: boolean;
  source: DashboardAlertSource;
  submissionId?: string;
  branchId?: string;
  branchName?: string;
  workflowStatus?: WorkflowStatus;
  assignedUserId?: string | null;
  assignedUserName?: string;
  createdAtIso?: string;
  urgency?: "low" | "medium" | "high" | "critical" | null;
  slaBreached?: boolean;
  hoursOpen?: number;
};

export type DashboardAlertStatusFilter =
  | "todos"
  | "nuevo"
  | "en_revision"
  | "escalado";

export function buildDashboardAlertItems(params: {
  notifications: DashboardNotification[];
  attentionItems: DashboardAttentionItem[];
}): DashboardAlertItem[] {
  const notificationAlerts: DashboardAlertItem[] = params.notifications
    .filter((notification) => notification.tone === "danger")
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      subtitle: notification.time,
      detail: notification.detail,
      priority: notification.unread ? "Nueva" : "Seguimiento",
      owner: undefined,
      probableCause: undefined,
      suggestedSla: undefined,
      requiresContact: undefined,
      tone: notification.tone,
      unread: notification.unread,
      source: "notificacion" as const,
    }));

  const attentionAlerts: DashboardAlertItem[] = params.attentionItems.map(
    (item, index) => {
      const slaBreached = item.createdAtIso
        ? isSlaBreached({
            createdAtIso: item.createdAtIso,
            urgency: item.urgency,
            workflowStatus: item.workflowStatus,
          })
        : false;

      return {
        id: item.submissionId
          ? `submission-${item.submissionId}`
          : `attention-${index}-${item.title}`,
        title: item.title,
        subtitle: `${item.branchName ?? item.owner} · hace ${item.age}`,
        detail: item.description,
        priority: item.priority,
        owner: item.owner,
        probableCause: item.probableCause,
        suggestedSla: item.suggestedSla,
        requiresContact: item.requiresContact,
        tone: item.tone,
        unread: item.status === "Pendiente",
        source: "ia" as const,
        submissionId: item.submissionId,
        branchId: item.branchId,
        branchName: item.branchName,
        workflowStatus: item.workflowStatus,
        assignedUserId: item.assignedUserId,
        assignedUserName: item.assignedUserName,
        createdAtIso: item.createdAtIso,
        urgency: item.urgency,
        slaBreached,
        hoursOpen: item.createdAtIso ? getHoursOpen(item.createdAtIso) : undefined,
      };
    },
  );

  const seen = new Set<string>();
  return [...notificationAlerts, ...attentionAlerts].filter((alert) => {
    const key = alert.submissionId ?? alert.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterDashboardAlerts(
  alerts: DashboardAlertItem[],
  params: {
    status?: DashboardAlertStatusFilter;
    branchId?: string | null;
  },
) {
  return alerts.filter((alert) => {
    if (params.branchId && alert.branchId !== params.branchId) {
      return false;
    }

    if (!params.status || params.status === "todos") {
      return true;
    }

    if (alert.source === "notificacion") {
      return params.status === "nuevo";
    }

    return alert.workflowStatus === params.status;
  });
}

export function getAlertSourceLabel(source: DashboardAlertSource) {
  return source === "ia" ? "IA" : "Sistema";
}

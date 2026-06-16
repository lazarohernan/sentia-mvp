import type { DashboardAttentionItem, DashboardNotification } from "./schemas";

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
};

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
    }));

  const attentionAlerts: DashboardAlertItem[] = params.attentionItems.map(
    (item, index) => ({
      id: item.submissionId
        ? `submission-${item.submissionId}`
        : `attention-${index}-${item.title}`,
      title: item.title,
      subtitle: `${item.owner} · hace ${item.age}`,
      detail: item.description,
      priority: item.priority,
      owner: item.owner,
      probableCause: item.probableCause,
      suggestedSla: item.suggestedSla,
      requiresContact: item.requiresContact,
      tone: item.tone,
      unread: item.status === "Pendiente",
    }),
  );

  const seen = new Set<string>();
  return [...notificationAlerts, ...attentionAlerts].filter((alert) => {
    const key = alert.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

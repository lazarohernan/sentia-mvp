import type { DashboardDateRange } from "./date-range";

export type DashboardMetric = {
  label: "Comentarios" | "CSAT" | "Alertas" | "Sucursales";
  value: string;
  detail: string;
};

export type DashboardAttentionItem = {
  priority: string;
  title: string;
  description: string;
  owner: string;
  age: string;
  status: "Pendiente" | "En revisión" | "Resuelto";
  tone: "success" | "warning" | "danger";
};

export type DashboardBranchHealthItem = {
  branch: string;
  status: string;
  csat: string;
  comments: string;
  tone: "success" | "warning" | "danger";
  marker: number;
  segments: [number, number, number];
};

export type DashboardRecentComment = {
  id: string;
  branch: string;
  comment: string;
  sentiment: "Positivo" | "Neutral" | "Riesgo";
  csat: string;
  status: "Pendiente" | "En revisión" | "Resuelto";
  date: string;
  tone: "success" | "warning" | "danger";
};

export type DashboardCommentRow = {
  id: string;
  customer: string;
  business: string;
  branch: string;
  sentiment: "Positivo" | "Neutral" | "Riesgo";
  csatScore: number;
  status: "Nuevo" | "En revisión" | "Resuelto" | "Escalado";
  message: string;
  receivedAt: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  href: string;
  unread: boolean;
  tone: "success" | "warning" | "danger";
};

export type DashboardInsight = {
  status: string;
  confidence: string;
  headline: string;
  detail: string;
  action: string;
  dominantPattern: string;
  dominantPatternDetail: string;
  actionDetail: string;
  reasonMetrics: Array<{
    value: string;
    label: string;
  }>;
};

export type DashboardSummaryData = {
  organizationName?: string;
  scope: string;
  period: string;
  dateRange: DashboardDateRange;
  metrics: DashboardMetric[];
  insight: DashboardInsight | null;
  attentionItems: DashboardAttentionItem[];
  branchHealth: DashboardBranchHealthItem[];
  recentComments: DashboardRecentComment[];
  comments: DashboardCommentRow[];
  notifications: DashboardNotification[];
};

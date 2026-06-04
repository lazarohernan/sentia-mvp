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
  submissionId?: string;
};

export type DashboardBranchHealthItem = {
  branch: string;
  status: string;
  csat: string;
  comments: string;
  tone: "success" | "warning" | "danger" | "neutral";
  zoneCounts: {
    risk: number;
    observation: number;
    good: number;
  };
  zonePercents: {
    risk: number;
    observation: number;
    good: number;
  };
  scoredCount: number;
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

export type DashboardFeedbackType =
  | "Opinión"
  | "Queja"
  | "Observación"
  | "Felicitación"
  | "Recomendación";

export type DashboardCommentRow = {
  id: string;
  customer: string;
  business: string;
  branch: string;
  feedbackType: DashboardFeedbackType;
  sentiment: "Positivo" | "Neutral" | "Riesgo";
  csatScore: number;
  status: "Nuevo" | "En revisión" | "En proceso" | "Resuelto" | "Escalado";
  message: string;
  receivedAt: string;
  analysisSummary?: string;
  recommendedAction?: string;
  dominantPattern?: string;
  informationQuality?: "sufficient" | "partial" | "insufficient";
  followUpQuestion?: string;
  followUpAnswer?: string;
  analysisConfidence?: string;
  analysisModel?: string;
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

export type DashboardFollowUpMetrics = {
  openCount: number;
  escalatedCount: number;
  inReviewCount: number;
  resolvedCount: number;
  avgResponseHours: number | null;
  avgResolutionHours: number | null;
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
  followUpMetrics: DashboardFollowUpMetrics;
  qrScanCounts: Record<string, number>;
};

export type AgentPeriod = "7d" | "30d";

export type AgentFeedbackRecord = {
  id: string;
  branch: string;
  type: string;
  message: string;
  csatScore: number | null;
  createdAt: string;
  sentiment: "Positivo" | "Neutral" | "Riesgo";
  dominantPattern: string;
  informationQuality: "sufficient" | "partial" | "insufficient" | null;
  recommendedAction: string | null;
  analysisSummary: string | null;
};

export type AgentBranchSnapshot = {
  branch: string;
  total: number;
  risk: number;
  readinessPercent: number;
  topPattern: string;
  recommendedAction: string;
};

export type AgentContextSnapshot = {
  organizationId: string;
  period: AgentPeriod;
  commentsCount: number;
  generatedAt: string;
  readinessPercent: number;
  qualityPercent: number;
  missingUsefulResponses: number;
  priorityBranch: AgentBranchSnapshot | null;
  branchReports: AgentBranchSnapshot[];
  recentComments: AgentFeedbackRecord[];
};

export type AgentOperationalReport = {
  headline: string;
  summary: string;
  nextActions: string[];
  deliveryReadiness: string;
  generatedAt: string;
  context: AgentContextSnapshot;
};

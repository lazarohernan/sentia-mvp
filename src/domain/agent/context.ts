import type { SupabaseClient } from "@supabase/supabase-js";

import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { buildBranchReports, buildReportReadiness } from "@/domain/dashboard/report-readiness";
import type { DashboardCommentRow } from "@/domain/dashboard/schemas";
import type { Database } from "@/lib/supabase/database.types";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";

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

export type AgentKnowledgeSnapshot = {
  peakHours: string | null;
  servicePriorities: string | null;
  compensationPolicy: string | null;
  followUpTone: string | null;
  agentNotes: string | null;
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
  knowledge: AgentKnowledgeSnapshot;
};

export type AgentOperationalReport = {
  headline: string;
  summary: string;
  nextActions: string[];
  deliveryReadiness: string;
  generatedAt: string;
  context: AgentContextSnapshot;
};

type Client = SupabaseClient<Database>;

type FeedbackSubmissionRow = {
  id: string;
  type: string;
  csat_score: number | null;
  free_text: string;
  created_at: string;
  branch_id: string;
  branches: {
    id: string;
    name: string;
    organization_id: string;
  } | null;
};

type BranchRow = {
  id: string;
  name: string;
  organization_id: string;
};

type AiAnalysisRow = {
  submission_id: string;
  sentiment: "positive" | "neutral" | "negative" | null;
  category: string | null;
  summary: string | null;
  recommended_action: string | null;
  information_quality: "sufficient" | "partial" | "insufficient" | null;
};

const HONDURAS_TIME_ZONE = "America/Tegucigalpa";
const weekdayFormatter = new Intl.DateTimeFormat("es-HN", {
  weekday: "long",
  timeZone: HONDURAS_TIME_ZONE,
});
const hourFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hour12: false,
  timeZone: HONDURAS_TIME_ZONE,
});

function getPeakHourWeight(comment: AgentFeedbackRecord) {
  if (comment.sentiment === "Riesgo") {
    return 3;
  }

  if (comment.sentiment === "Neutral") {
    return 1.5;
  }

  return 1;
}

function formatHourRange(startHour: number, durationHours: number) {
  const formatter = new Intl.DateTimeFormat("es-HN", {
    hour: "numeric",
    hour12: true,
    timeZone: HONDURAS_TIME_ZONE,
  });
  const startDate = new Date(Date.UTC(2026, 0, 1, startHour));
  const endDate = new Date(Date.UTC(2026, 0, 1, startHour + durationHours));
  const start = formatter
    .format(startDate)
    .replace(/\s+/g, "")
    .toLowerCase();
  const end = formatter
    .format(endDate)
    .replace(/\s+/g, "")
    .toLowerCase();

  return `${start} a ${end}`;
}

function deriveAutomaticPeakHours(comments: AgentFeedbackRecord[]) {
  if (comments.length < 4) {
    return null;
  }

  const branchDayHourScores = new Map<string, number>();

  for (const comment of comments) {
    const createdAt = new Date(comment.createdAt);
    const weekday = weekdayFormatter.format(createdAt).toLowerCase();
    const hour = Number.parseInt(hourFormatter.format(createdAt), 10);

    if (Number.isNaN(hour)) {
      continue;
    }

    const key = `${comment.branch}__${weekday}__${hour}`;
    branchDayHourScores.set(
      key,
      (branchDayHourScores.get(key) ?? 0) + getPeakHourWeight(comment),
    );
  }

  const windows = new Map<
    string,
    { branch: string; weekday: string; startHour: number; score: number }
  >();

  for (const [key] of branchDayHourScores.entries()) {
    const [branch, weekday] = key.split("__");

    for (let startHour = 0; startHour <= 21; startHour += 1) {
      const score =
        (branchDayHourScores.get(`${branch}__${weekday}__${startHour}`) ?? 0) +
        (branchDayHourScores.get(`${branch}__${weekday}__${startHour + 1}`) ?? 0) +
        (branchDayHourScores.get(`${branch}__${weekday}__${startHour + 2}`) ?? 0);

      if (score <= 0) {
        continue;
      }

      const windowKey = `${branch}__${weekday}__${startHour}`;
      const current = windows.get(windowKey);

      if (!current || score > current.score) {
        windows.set(windowKey, { branch, weekday, startHour, score });
      }
    }
  }

  const ranked = [...windows.values()]
    .sort((left, right) => right.score - left.score)
    .filter((window, index, array) => {
      if (index === 0) {
        return true;
      }

      return !array
        .slice(0, index)
        .some(
          (seen) => seen.branch === window.branch && seen.weekday === window.weekday,
        );
    })
    .slice(0, 2);

  if (ranked.length === 0) {
    return null;
  }

  return ranked
    .map(
      (window) =>
        `${window.branch}: ${window.weekday} ${formatHourRange(window.startHour, 3)}`,
    )
    .join("; ");
}

function mapSentiment(value: AiAnalysisRow["sentiment"], csatScore: number | null) {
  if (value === "negative" || (csatScore !== null && csatScore <= 2)) {
    return "Riesgo" as const;
  }

  if (value === "positive" || (csatScore ?? 0) >= 4) {
    return "Positivo" as const;
  }

  return "Neutral" as const;
}

function mapCommentRow(record: AgentFeedbackRecord): DashboardCommentRow {
  return {
    id: record.id,
    customer: "Cliente anónimo",
    business: "Feedback",
    branch: record.branch,
    feedbackType: "Observación",
    sentiment: record.sentiment,
    csatScore: record.csatScore ?? 0,
    status: "Nuevo",
    message: record.message,
    receivedAt: record.createdAt,
    analysisSummary: record.analysisSummary ?? undefined,
    recommendedAction: record.recommendedAction ?? undefined,
    dominantPattern: record.dominantPattern,
    informationQuality: record.informationQuality ?? undefined,
    analysisModel: "agent-context-api",
  };
}

export async function buildAgentContextSnapshot(
  client: Client,
  params: {
    organizationId: string;
    branchIds?: string[];
    period: AgentPeriod;
  },
): Promise<AgentContextSnapshot> {
  const dateRange = getDashboardDateRange({ period: params.period });
  const organizationSettings = await getOrganizationSettingsById(
    client,
    params.organizationId,
  );

  let branchQuery = client
    .from("branches")
    .select("id, name, organization_id")
    .eq("organization_id", params.organizationId)
    .eq("is_active", true);

  if (params.branchIds && params.branchIds.length > 0) {
    branchQuery = branchQuery.in("id", params.branchIds);
  }

  const { data: branchesData, error: branchesError } = await branchQuery;
  const branches = (branchesData ?? []) as BranchRow[];

  if (branchesError || branches.length === 0) {
    throw new Error("No se pudieron cargar sucursales para el agente.");
  }

  const branchIds = branches.map((branch) => branch.id);

  const { data: feedbackRows, error: feedbackError } = await client
    .from("feedback_submissions")
    .select(
      "id, type, csat_score, free_text, created_at, branch_id, branches!inner(id, name, organization_id)",
    )
    .in("branch_id", branchIds)
    .gte("created_at", dateRange.startIso)
    .lte("created_at", dateRange.endIso)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (feedbackError) {
    throw new Error(`No se pudo cargar feedback para el agente: ${feedbackError.message}`);
  }

  const rows = (feedbackRows ?? []) as unknown as FeedbackSubmissionRow[];
  const ids = rows.map((item) => item.id);

  const analyses = ids.length
    ? await client
        .from("ai_analyses")
        .select(
          "submission_id, sentiment, category, summary, recommended_action, information_quality",
        )
        .in("submission_id", ids)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (analyses.error) {
    throw new Error(`No se pudo cargar analisis para el agente: ${analyses.error.message}`);
  }

  const analysisMap = new Map<string, AiAnalysisRow>();
  for (const row of (analyses.data ?? []) as AiAnalysisRow[]) {
    if (!analysisMap.has(row.submission_id)) {
      analysisMap.set(row.submission_id, row);
    }
  }

  const comments: AgentFeedbackRecord[] = rows.map((row) => {
    const analysis = analysisMap.get(row.id);
    return {
      id: row.id,
      branch: row.branches?.name ?? "Sucursal",
      type: row.type,
      message: row.free_text,
      csatScore: row.csat_score,
      createdAt: row.created_at,
      sentiment: mapSentiment(analysis?.sentiment ?? null, row.csat_score),
      dominantPattern: analysis?.category ?? "Experiencia general",
      informationQuality: analysis?.information_quality ?? null,
      recommendedAction: analysis?.recommended_action ?? null,
      analysisSummary: analysis?.summary ?? null,
    };
  });

  const dashboardComments = comments.map(mapCommentRow);
  const reports = buildBranchReports(dashboardComments);
  const readiness = buildReportReadiness(dashboardComments, reports);

  return {
    organizationId: params.organizationId,
    period: params.period,
    commentsCount: comments.length,
    generatedAt: new Date().toISOString(),
    readinessPercent: readiness.percent,
    qualityPercent: readiness.qualityPercent,
    missingUsefulResponses: readiness.missingUsefulResponses,
    priorityBranch: reports[0]
      ? {
          branch: reports[0].branch,
          total: reports[0].total,
          risk: reports[0].risk,
          readinessPercent: reports[0].readinessPercent,
          topPattern: reports[0].topPattern,
          recommendedAction: reports[0].recommendedAction,
        }
      : null,
    branchReports: reports.map((report) => ({
      branch: report.branch,
      total: report.total,
      risk: report.risk,
      readinessPercent: report.readinessPercent,
      topPattern: report.topPattern,
      recommendedAction: report.recommendedAction,
    })),
    recentComments: comments.slice(0, 10),
    knowledge: {
      peakHours:
        organizationSettings?.peakHours ?? deriveAutomaticPeakHours(comments),
      servicePriorities: organizationSettings?.servicePriorities ?? null,
      compensationPolicy: organizationSettings?.compensationPolicy ?? null,
      followUpTone: organizationSettings?.followUpTone ?? null,
      agentNotes: organizationSettings?.agentNotes ?? null,
    },
  };
}

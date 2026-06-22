import type { SupabaseClient } from "@supabase/supabase-js";

import type { Branch } from "@/domain/branches/schemas";
import { getBranchQrScanCounts } from "@/domain/branches/qr-scans";
import { computeFollowUpMetrics, getWorkflowStatusForRecord } from "@/domain/feedback/follow-up";
import { getCategoryLabel } from "@/domain/feedback/sentiment-analysis";
import {
  formatRelativeDate,
  formatTableDate,
  getAnalysis,
  getFeedbackTypeLabel,
  getSentiment,
  getStatus,
  getTone,
  sanitizeFeedbackText,
  truncate,
  type FeedbackRecord,
} from "@/domain/feedback/record-analysis";
import {
  isOpenWorkflowStatus,
  workflowStatusToLabel,
} from "@/domain/feedback/workflow-status";
import { buildExecutiveNotificationDrafts } from "@/domain/notifications/executive-summaries";
import { buildReportReadyNotificationDrafts } from "@/domain/notifications/report-ready";
import type { ReportCadence } from "@/domain/dashboard/report-cadence";
import {
  getNotificationsForOrganization,
  syncNotificationDrafts,
} from "@/domain/notifications/repository";
import type { Database } from "@/lib/supabase/database.types";
import type { DashboardDateRange } from "./date-range";
import { computeRatingsHealth } from "./ratings-health";
import type {
  DashboardAttentionItem,
  DashboardBranchHealthItem,
  DashboardCommentRow,
  DashboardInsight,
  DashboardMetric,
  DashboardRecentComment,
  DashboardSummaryData,
} from "./schemas";

type Client = SupabaseClient<Database>;

type FeedbackQueryClient = {
  from: (table: "feedback_submissions") => {
    select: (columns: string) => {
      in: (
        column: "branch_id",
        values: string[],
      ) => {
        gte: (column: "created_at", value: string) => {
          lte: (column: "created_at", value: string) => {
            order: (
              column: "created_at",
              options: { ascending: boolean },
            ) => {
              range: (
                from: number,
                to: number,
              ) => Promise<{
                data: unknown;
                error: unknown;
              }>;
            };
          };
        };
      };
    };
  };
};

const FEEDBACK_QUERY_PAGE_SIZE = 1000;
const feedbackSelectColumns = `
  id,
  type,
  emotion_score,
  csat_score,
  free_text,
  contact_name,
  workflow_status,
  assigned_user_id,
  first_response_at,
  resolved_at,
  created_at,
  branch_id,
  branches!inner(id, name, slug, organization_id)
`;

type AiAnalysisRow = NonNullable<FeedbackRecord["ai_analyses"]>[number] & {
  submission_id: string;
};

type AiAnalysesQueryClient = {
  from: (table: "ai_analyses") => {
    select: (columns: string) => {
      in: (
        column: "submission_id",
        values: string[],
      ) => {
        order: (
          column: "created_at",
          options: { ascending: boolean },
        ) => Promise<{
          data: unknown;
          error: unknown;
        }>;
      };
    };
  };
};

async function getAnalysesForFeedback(
  client: Client,
  submissionIds: string[],
) {
  const queryClient = client as unknown as AiAnalysesQueryClient;
  const analysesBySubmission = new Map<string, AiAnalysisRow[]>();
  const chunkSize = 500;

  for (let index = 0; index < submissionIds.length; index += chunkSize) {
    const chunk = submissionIds.slice(index, index + chunkSize);
    const { data, error } = await queryClient
      .from("ai_analyses")
      .select(
        "submission_id, status, sentiment, urgency, category, summary, probable_cause, recommended_action, suggested_owner, suggested_sla, requires_contact, information_quality, follow_up_question, follow_up_answer, model_used, confidence",
      )
      .in("submission_id", chunk)
      .order("created_at", { ascending: false });

    if (error || !data) {
      continue;
    }

    for (const analysis of data as AiAnalysisRow[]) {
      const current = analysesBySubmission.get(analysis.submission_id) ?? [];
      current.push(analysis);
      analysesBySubmission.set(analysis.submission_id, current);
    }
  }

  return analysesBySubmission;
}

async function attachAnalysesToFeedback(
  client: Client,
  feedback: FeedbackRecord[],
) {
  if (feedback.length === 0) {
    return feedback;
  }

  const analysesBySubmission = await getAnalysesForFeedback(
    client,
    feedback.map((record) => record.id),
  );

  return feedback.map((record) => ({
    ...record,
    ai_analyses:
      analysesBySubmission.get(record.id) ?? record.ai_analyses ?? [],
  }));
}

async function getFeedbackRecordsForDashboard(
  client: Client,
  params: {
    branchIds: string[];
    dateRange: DashboardDateRange;
  },
): Promise<FeedbackRecord[]> {
  const queryClient = client as unknown as FeedbackQueryClient;
  const records: FeedbackRecord[] = [];

  for (let offset = 0; ; offset += FEEDBACK_QUERY_PAGE_SIZE) {
    const { data, error } = await queryClient
      .from("feedback_submissions")
      .select(feedbackSelectColumns)
      .in("branch_id", params.branchIds)
      .gte("created_at", params.dateRange.startIso)
      .lte("created_at", params.dateRange.endIso)
      .order("created_at", { ascending: false })
      .range(offset, offset + FEEDBACK_QUERY_PAGE_SIZE - 1);

    if (error || !data) {
      return attachAnalysesToFeedback(client, records);
    }

    const page = data as FeedbackRecord[];
    records.push(...page);

    if (page.length < FEEDBACK_QUERY_PAGE_SIZE) {
      return attachAnalysesToFeedback(client, records);
    }
  }
}

function buildMetrics(branches: Branch[], feedback: FeedbackRecord[]): DashboardMetric[] {
  const csatScores = feedback
    .map((record) => record.csat_score)
    .filter((score): score is number => typeof score === "number");
  const averageCsat =
    csatScores.length > 0
      ? csatScores.reduce((sum, score) => sum + score, 0) / csatScores.length
      : null;
  const alertCount = feedback.filter((record) => getTone(record) === "danger").length;
  const activeBranches = branches.filter((branch) => branch.is_active).length;

  return [
    {
      label: "Comentarios",
      value: feedback.length.toLocaleString("es-HN"),
      detail: feedback.length > 0 ? "Total recibido" : "",
    },
    {
      label: "CSAT",
      value: averageCsat === null ? "Sin datos" : `${averageCsat.toFixed(1)}/5`,
      detail: averageCsat === null ? "" : "CSAT promedio",
    },
    {
      label: "Alertas",
      value: alertCount.toString(),
      detail: alertCount > 0 ? `${alertCount} requieren seguimiento` : "",
    },
    {
      label: "Sucursales",
      value: branches.length.toString(),
      detail:
        branches.length > 0
          ? `${activeBranches} activas hoy`
          : "Sin sucursales configuradas",
    },
  ];
}

const BRANCH_HEALTH_PREVIEW_LIMIT = 3;

const branchHealthToneOrder: Record<DashboardBranchHealthItem["tone"], number> = {
  danger: 0,
  warning: 1,
  neutral: 2,
  success: 3,
};

function compareBranchHealthPriority(
  left: DashboardBranchHealthItem,
  right: DashboardBranchHealthItem,
) {
  const toneDiff =
    branchHealthToneOrder[left.tone] - branchHealthToneOrder[right.tone];
  if (toneDiff !== 0) {
    return toneDiff;
  }

  const riskDiff = right.zonePercents.risk - left.zonePercents.risk;
  if (riskDiff !== 0) {
    return riskDiff;
  }

  const leftCsat = left.csat === "N/A" ? Number.POSITIVE_INFINITY : Number.parseFloat(left.csat);
  const rightCsat =
    right.csat === "N/A" ? Number.POSITIVE_INFINITY : Number.parseFloat(right.csat);

  return leftCsat - rightCsat;
}

function buildBranchHealth(
  branches: Branch[],
  feedback: FeedbackRecord[],
): DashboardBranchHealthItem[] {
  return branches
    .map((branch) => {
      const branchFeedback = feedback.filter(
        (record) => record.branch_id === branch.id,
      );
      const scores = branchFeedback
        .map((record) => record.csat_score)
        .filter((score): score is number => typeof score === "number");
      const metrics = computeRatingsHealth({
        scores,
        totalCount: branchFeedback.length,
      });
      const tone: DashboardBranchHealthItem["tone"] =
        metrics.zone === "good"
          ? "success"
          : metrics.zone === "observation"
            ? "warning"
            : metrics.zone === "risk"
              ? "danger"
              : "neutral";

      return {
        branchId: branch.id,
        branch: branch.name,
        status:
          metrics.scoredCount === 0 ? "Sin comentarios" : metrics.label,
        csat:
          metrics.averageCsat === null ? "N/A" : metrics.averageCsat.toFixed(1),
        comments: `${branchFeedback.length} comentarios`,
        tone,
        zoneCounts: metrics.zoneCounts,
        zonePercents: metrics.zonePercents,
        scoredCount: metrics.scoredCount,
      };
    })
    .sort(compareBranchHealthPriority)
    .slice(0, BRANCH_HEALTH_PREVIEW_LIMIT);
}

function buildComments(feedback: FeedbackRecord[]): DashboardCommentRow[] {
  return feedback.slice(0, 50).map((record) => {
    const analysis = getAnalysis(record);
    const confidence =
      typeof analysis?.confidence === "number"
        ? `${Math.round(analysis.confidence * 100)}% confianza`
        : undefined;

    return {
      id: record.id,
      customer: record.contact_name || "Cliente anónimo",
      business: "Feedback",
      branch: record.branches?.name ?? "Sucursal",
      branchId: record.branch_id,
      feedbackType: getFeedbackTypeLabel(record.type),
      sentiment: getSentiment(record),
      csatScore: record.csat_score ?? record.emotion_score,
      status: getStatus(record),
      message: sanitizeFeedbackText(record.free_text),
      receivedAt: formatRelativeDate(record.created_at),
      createdAtIso: record.created_at,
      analysisSummary: analysis?.summary ?? undefined,
      probableCause: analysis?.probable_cause ?? undefined,
      recommendedAction: analysis?.recommended_action ?? undefined,
      suggestedOwner: analysis?.suggested_owner ?? undefined,
      suggestedSla: analysis?.suggested_sla ?? undefined,
      requiresContact: analysis?.requires_contact ?? undefined,
      dominantPattern: analysis?.category
        ? getCategoryLabel(analysis.category)
        : undefined,
      informationQuality: analysis?.information_quality ?? undefined,
      followUpQuestion: analysis?.follow_up_question ?? undefined,
      followUpAnswer: analysis?.follow_up_answer ?? undefined,
      analysisConfidence: confidence,
      analysisModel: analysis?.model_used ?? undefined,
    };
  });
}

function buildRecentComments(feedback: FeedbackRecord[]): DashboardRecentComment[] {
  return feedback.slice(0, 4).map((record) => {
    const tone = getTone(record);
    const workflowStatus = getStatus(record);
    const status: DashboardRecentComment["status"] =
      workflowStatus === "Escalado" || workflowStatus === "En revisión"
        ? "En revisión"
        : workflowStatus === "Resuelto"
          ? "Resuelto"
          : "Pendiente";

    return {
      id: record.id,
      branch: record.branches?.name ?? "Sucursal",
      comment: truncate(sanitizeFeedbackText(record.free_text), 38),
      sentiment: getSentiment(record),
      csat: record.csat_score === null ? "N/A" : `${record.csat_score}/5`,
      status,
      date: formatTableDate(record.created_at),
      tone,
    };
  });
}

function mapWorkflowToAttentionStatus(
  status: ReturnType<typeof getWorkflowStatusForRecord>,
): DashboardAttentionItem["status"] {
  if (status === "resuelto") {
    return "Resuelto";
  }

  if (status === "en_revision" || status === "en_proceso" || status === "escalado") {
    return "En revisión";
  }

  return "Pendiente";
}

function buildAttentionItems(feedback: FeedbackRecord[]): DashboardAttentionItem[] {
  return feedback
    .filter((record) => {
      const workflowStatus = getWorkflowStatusForRecord(record);
      if (!isOpenWorkflowStatus(workflowStatus)) {
        return false;
      }

      return getTone(record) === "danger" || workflowStatus === "escalado";
    })
    .slice(0, 20)
    .map((record, index) => {
      const analysis = getAnalysis(record);
      const workflowStatus = getWorkflowStatusForRecord(record);
      const priority =
        workflowStatus === "escalado" || analysis?.urgency === "critical" || index === 0
          ? "Prioridad alta"
          : "Prioridad media";
      const suggestedOwner = analysis?.suggested_owner?.trim();
      const probableCause = analysis?.probable_cause?.trim();
      const suggestedSla = analysis?.suggested_sla?.trim();
      const categoryLabel = getCategoryLabel(analysis?.category);

      return {
        priority,
        title: `${record.branches?.name ?? "Sucursal"} - ${categoryLabel}`,
        description:
          [
            analysis?.recommended_action ?? "Revisar comentario con el equipo",
          ].filter(Boolean).join(" "),
        owner: suggestedOwner || workflowStatusToLabel(workflowStatus),
        probableCause: probableCause ?? undefined,
        suggestedSla: suggestedSla ?? undefined,
        requiresContact: analysis?.requires_contact === true,
        age: formatRelativeDate(record.created_at).replace("Hace ", ""),
        status: mapWorkflowToAttentionStatus(workflowStatus),
        tone: priority === "Prioridad alta" ? "danger" : "warning",
        submissionId: record.id,
        branchId: record.branch_id,
        branchName: record.branches?.name ?? undefined,
        workflowStatus,
        assignedUserId: record.assigned_user_id ?? null,
        createdAtIso: record.created_at,
        urgency: analysis?.urgency ?? null,
        categoryLabel,
      };
    });
}

function buildInsight(feedback: FeedbackRecord[]): DashboardInsight | null {
  const risky = feedback.filter((record) => getTone(record) === "danger");
  const target = risky[0] ?? feedback[0];

  if (!target) return null;

  const analysis = getAnalysis(target);
  const branchName = target.branches?.name ?? "La sucursal";
  const category = getCategoryLabel(analysis?.category);
  const confidence =
    typeof analysis?.confidence === "number"
      ? `${Math.round(analysis.confidence * 100)}% confianza`
      : "Señal detectada";

  return {
    status: "Insight IA",
    confidence,
    headline: `${branchName} necesita revisión operativa hoy`,
    detail:
      analysis?.summary ??
      "Se detectaron comentarios recientes que conviene revisar antes de que escalen.",
    action: analysis?.recommended_action ?? "Asignar a gerencia de turno",
    dominantPattern: category,
    dominantPatternDetail: "Tema repetido en comentarios recientes",
    actionDetail: "Revisar el caso y documentar seguimiento",
    reasonMetrics: [
      {
        value: risky.length.toString(),
        label: "Comentarios en riesgo",
      },
      {
        value: target.csat_score === null ? "N/A" : `${target.csat_score}/5`,
        label: `CSAT en ${branchName}`,
      },
      {
        value: formatRelativeDate(target.created_at),
        label: "Última señal recibida",
      },
    ],
  };
}

async function loadDashboardNotifications(
  client: Client,
  params: {
    organizationId: string;
    dateRange: DashboardDateRange;
    feedback: FeedbackRecord[];
    comments: DashboardCommentRow[];
    reportCadence?: ReportCadence;
    branchIds?: string[];
    syncDrafts?: boolean;
  },
) {
  const executiveDrafts = buildExecutiveNotificationDrafts(params.feedback, {
    organizationId: params.organizationId,
    dateRange: params.dateRange,
  });
  const reportDrafts = buildReportReadyNotificationDrafts({
    organizationId: params.organizationId,
    dateRange: params.dateRange,
    reportCadence: params.reportCadence ?? "monthly",
    comments: params.comments,
  });
  const drafts = [...executiveDrafts, ...reportDrafts];

  if (params.syncDrafts !== false) {
    try {
      await syncNotificationDrafts(client, drafts);
    } catch {
      // La sincronización no debe bloquear el dashboard.
    }
  }

  return getNotificationsForOrganization(client, params.organizationId, {
    startIso: params.dateRange.startIso,
    endIso: params.dateRange.endIso,
    branchIds: params.branchIds,
    limit: 20,
  });
}

export async function getDashboardSummaryData(
  client: Client,
  params: {
    organizationId?: string;
    organizationName?: string;
    branches: Branch[];
    dateRange: DashboardDateRange;
    reportCadence?: ReportCadence;
    syncNotificationDrafts?: boolean;
  },
): Promise<DashboardSummaryData> {
  const branchIds = params.branches.map((branch) => branch.id);
  let feedback: FeedbackRecord[] = [];

  if (branchIds.length > 0) {
    feedback = await getFeedbackRecordsForDashboard(client, {
      branchIds,
      dateRange: params.dateRange,
    });
  }

  const comments = buildComments(feedback);
  const notifications =
    params.organizationId && feedback.length > 0
      ? await loadDashboardNotifications(client, {
          organizationId: params.organizationId,
          dateRange: params.dateRange,
          feedback,
          comments,
          reportCadence: params.reportCadence,
          branchIds,
          syncDrafts: params.syncNotificationDrafts,
        })
      : params.organizationId
        ? await getNotificationsForOrganization(client, params.organizationId, {
            startIso: params.dateRange.startIso,
            endIso: params.dateRange.endIso,
            branchIds,
            limit: 20,
          })
        : [];

  const qrScanCounts = params.organizationId
    ? await getBranchQrScanCounts(client, params.organizationId, branchIds)
    : {};

  return {
    organizationName: params.organizationName,
    scope:
      params.branches.length === 1
        ? "1 sucursal"
        : `${params.branches.length} sucursales`,
    period: params.dateRange.label,
    dateRange: params.dateRange,
    metrics: buildMetrics(params.branches, feedback),
    insight: buildInsight(feedback),
    attentionItems: buildAttentionItems(feedback),
    branchHealth: buildBranchHealth(params.branches, feedback),
    recentComments: buildRecentComments(feedback),
    comments,
    notifications,
    followUpMetrics: computeFollowUpMetrics(feedback),
    qrScanCounts,
  };
}

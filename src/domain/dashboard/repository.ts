import type { SupabaseClient } from "@supabase/supabase-js";

import type { Branch } from "@/domain/branches/schemas";
import {
  formatRelativeDate,
  formatTableDate,
  getAnalysis,
  getSentiment,
  getStatus,
  getTone,
  truncate,
  type FeedbackRecord,
} from "@/domain/feedback/record-analysis";
import { buildExecutiveNotificationDrafts } from "@/domain/notifications/executive-summaries";
import {
  getNotificationsForOrganization,
  syncNotificationDrafts,
} from "@/domain/notifications/repository";
import type { Database } from "@/lib/supabase/database.types";
import type { DashboardDateRange } from "./date-range";
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
              limit: (
                count: number,
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

function buildBranchHealth(
  branches: Branch[],
  feedback: FeedbackRecord[],
): DashboardBranchHealthItem[] {
  return branches.slice(0, 4).map((branch) => {
    const branchFeedback = feedback.filter((record) => record.branch_id === branch.id);
    const scores = branchFeedback
      .map((record) => record.csat_score)
      .filter((score): score is number => typeof score === "number");
    const average =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null;
    const tone =
      average === null || average >= 4
        ? "success"
        : average >= 3
          ? "warning"
          : "danger";
    const marker = average === null ? 80 : Math.max(8, Math.min(92, (average / 5) * 100));

    return {
      branch: branch.name,
      status:
        average === null
          ? "Sin comentarios"
          : tone === "success"
            ? "Estable"
            : tone === "warning"
              ? "Observación"
              : "Riesgo",
      csat: average === null ? "N/A" : average.toFixed(1),
      comments: `${branchFeedback.length} comentarios`,
      tone,
      marker,
      segments: [58, 20, 22],
    };
  });
}

function buildComments(feedback: FeedbackRecord[]): DashboardCommentRow[] {
  return feedback.slice(0, 50).map((record) => ({
    id: record.id,
    customer: record.contact_name || "Cliente anónimo",
    business: "Feedback",
    branch: record.branches?.name ?? "Sucursal",
    sentiment: getSentiment(record),
    csatScore: record.csat_score ?? record.emotion_score,
    status: getStatus(record),
    message: record.free_text,
    receivedAt: formatRelativeDate(record.created_at),
  }));
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
      comment: truncate(record.free_text, 38),
      sentiment: getSentiment(record),
      csat: record.csat_score === null ? "N/A" : `${record.csat_score}/5`,
      status,
      date: formatTableDate(record.created_at),
      tone,
    };
  });
}

function buildAttentionItems(feedback: FeedbackRecord[]): DashboardAttentionItem[] {
  return feedback
    .filter((record) => getTone(record) === "danger")
    .slice(0, 3)
    .map((record, index) => {
      const analysis = getAnalysis(record);
      const priority =
        analysis?.urgency === "critical" || index === 0
          ? "Prioridad alta"
          : "Prioridad media";

      return {
        priority,
        title: `${record.branches?.name ?? "Sucursal"} - ${analysis?.category ?? "Caso por revisar"}`,
        description: analysis?.recommended_action ?? "Revisar comentario con el equipo",
        owner: "Operaciones",
        age: formatRelativeDate(record.created_at).replace("Hace ", ""),
        status: "Pendiente",
        tone: priority === "Prioridad alta" ? "danger" : "warning",
      };
    });
}

function buildInsight(feedback: FeedbackRecord[]): DashboardInsight | null {
  const risky = feedback.filter((record) => getTone(record) === "danger");
  const target = risky[0] ?? feedback[0];

  if (!target) return null;

  const analysis = getAnalysis(target);
  const branchName = target.branches?.name ?? "La sucursal";
  const category = analysis?.category ?? "Experiencia del cliente";
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
  },
) {
  const drafts = buildExecutiveNotificationDrafts(params.feedback, {
    organizationId: params.organizationId,
    dateRange: params.dateRange,
  });

  try {
    await syncNotificationDrafts(client, drafts);
  } catch {
    // La sincronización no debe bloquear el dashboard.
  }

  return getNotificationsForOrganization(client, params.organizationId, {
    startIso: params.dateRange.startIso,
    endIso: params.dateRange.endIso,
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
  },
): Promise<DashboardSummaryData> {
  const branchIds = params.branches.map((branch) => branch.id);
  let feedback: FeedbackRecord[] = [];

  if (branchIds.length > 0) {
    const queryClient = client as unknown as FeedbackQueryClient;
    const { data, error } = await queryClient
      .from("feedback_submissions")
      .select(
        `
          id,
          type,
          emotion_score,
          csat_score,
          free_text,
          contact_name,
          created_at,
          branch_id,
          branches!inner(id, name, slug, organization_id),
          ai_analyses(status, sentiment, urgency, category, summary, recommended_action, confidence)
        `,
      )
      .in("branch_id", branchIds)
      .gte("created_at", params.dateRange.startIso)
      .lte("created_at", params.dateRange.endIso)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      feedback = data as FeedbackRecord[];
    }
  }

  const notifications =
    params.organizationId && feedback.length > 0
      ? await loadDashboardNotifications(client, {
          organizationId: params.organizationId,
          dateRange: params.dateRange,
          feedback,
        })
      : params.organizationId
        ? await getNotificationsForOrganization(client, params.organizationId, {
            startIso: params.dateRange.startIso,
            endIso: params.dateRange.endIso,
            limit: 20,
          })
        : [];

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
    comments: buildComments(feedback),
    notifications,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Branch } from "@/domain/branches/schemas";
import type { Database } from "@/lib/supabase/database.types";
import type { DashboardDateRange } from "./date-range";
import type {
  DashboardAttentionItem,
  DashboardBranchHealthItem,
  DashboardCommentRow,
  DashboardInsight,
  DashboardMetric,
  DashboardNotification,
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

type FeedbackRecord = {
  id: string;
  type: string;
  emotion_score: number;
  csat_score: number | null;
  free_text: string;
  contact_name: string | null;
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
        recommended_action: string | null;
        confidence: number | null;
      }>
    | null;
};

function formatRelativeDate(value: string) {
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

function formatTableDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAnalysis(record: FeedbackRecord) {
  return record.ai_analyses?.[0] ?? null;
}

function getTone(record: FeedbackRecord): "success" | "warning" | "danger" {
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

function getSentiment(record: FeedbackRecord): "Positivo" | "Neutral" | "Riesgo" {
  const tone = getTone(record);
  if (tone === "danger") return "Riesgo";
  if (tone === "success") return "Positivo";
  return "Neutral";
}

function getStatus(record: FeedbackRecord): "Nuevo" | "En revisión" | "Resuelto" | "Escalado" {
  const analysis = getAnalysis(record);
  if (analysis?.urgency === "critical") return "Escalado";
  if (analysis?.urgency === "high" || getTone(record) === "danger") {
    return "En revisión";
  }
  return "Nuevo";
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 3).trim()}...`;
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

function buildNotifications(feedback: FeedbackRecord[]): DashboardNotification[] {
  if (feedback.length === 0) {
    return [];
  }

  const risky = feedback.filter((record) => getTone(record) === "danger");
  const positive = feedback.filter((record) => getTone(record) === "success");
  const branchRiskMap = new Map<
    string,
    {
      branch: string;
      count: number;
      latestAt: string;
      latestCategory: string | null;
    }
  >();

  for (const record of risky) {
    const branch = record.branches?.name ?? "Sucursal";
    const current = branchRiskMap.get(branch);
    const nextLatestAt =
      !current || new Date(record.created_at) > new Date(current.latestAt)
        ? record.created_at
        : current.latestAt;
    const nextCategory =
      !current || new Date(record.created_at) > new Date(current.latestAt)
        ? getAnalysis(record)?.category ?? null
        : current.latestCategory;

    branchRiskMap.set(branch, {
      branch,
      count: (current?.count ?? 0) + 1,
      latestAt: nextLatestAt,
      latestCategory: nextCategory,
    });
  }

  const topRiskBranch = [...branchRiskMap.values()].sort((a, b) => b.count - a.count)[0];
  const csatScores = feedback
    .map((record) => record.csat_score)
    .filter((score): score is number => typeof score === "number");
  const averageCsat =
    csatScores.length > 0
      ? csatScores.reduce((sum, score) => sum + score, 0) / csatScores.length
      : null;

  const notifications: DashboardNotification[] = [];

  if (topRiskBranch) {
    notifications.push({
      id: "manager-risk-summary",
      title: `${topRiskBranch.branch} concentra la mayor friccion del periodo`,
      detail:
        topRiskBranch.latestCategory === null
          ? `${topRiskBranch.count} comentarios en riesgo sugieren revisar la operacion de esa sucursal.`
          : `${topRiskBranch.count} comentarios en riesgo apuntan a ${topRiskBranch.latestCategory.toLowerCase()} y conviene revisarlo con gerencia.`,
      time: formatRelativeDate(topRiskBranch.latestAt),
      href: "/dashboard#alertas",
      unread: true,
      tone: "danger",
    });
  }

  notifications.push({
    id: "manager-period-summary",
    title: `Resumen ejecutivo: ${feedback.length} comentarios en ${feedback.length === 1 ? "el periodo" : "este periodo"}`,
    detail:
      risky.length > 0
        ? `${risky.length} requieren seguimiento y ${positive.length} reflejan una experiencia positiva.`
        : `No hay señales criticas; ${positive.length} reflejan una experiencia positiva y el resto se mantiene estable.`,
    time: paramsTimeFromFeedback(feedback),
    href: "/dashboard#resumen",
    unread: risky.length > 0,
    tone: risky.length > 0 ? "warning" : "success",
  });

  const positiveBranchScores = new Map<
    string,
    {
      branch: string;
      total: number;
      count: number;
      latestAt: string;
    }
  >();

  for (const record of positive) {
    const branch = record.branches?.name ?? "Sucursal";
    const current = positiveBranchScores.get(branch);
    const score = record.csat_score ?? 0;

    positiveBranchScores.set(branch, {
      branch,
      total: (current?.total ?? 0) + score,
      count: (current?.count ?? 0) + 1,
      latestAt:
        !current || new Date(record.created_at) > new Date(current.latestAt)
          ? record.created_at
          : current.latestAt,
    });
  }

  const positiveSummary = [...positiveBranchScores.values()]
    .map((item) => ({
      ...item,
      average: item.count > 0 ? item.total / item.count : 0,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count)[0];

  if (positiveSummary) {
    notifications.push({
      id: "manager-positive-summary",
      title: `${positiveSummary.branch} sostiene la mejor percepcion reciente`,
      detail:
        averageCsat === null
          ? `${positiveSummary.count} comentarios positivos marcan una señal de estabilidad para el gerente.`
          : `${positiveSummary.count} comentarios positivos ayudan a sostener un CSAT general de ${averageCsat.toFixed(1)}/5.`,
      time: formatRelativeDate(positiveSummary.latestAt),
      href: "/dashboard#comentarios",
      unread: false,
      tone: "success",
    });
  }

  return notifications.slice(0, 3);
}

function paramsTimeFromFeedback(feedback: FeedbackRecord[]) {
  const latest = feedback[0];
  return latest ? formatRelativeDate(latest.created_at) : "Ahora";
}

export async function getDashboardSummaryData(
  client: Client,
  params: {
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
    notifications: buildNotifications(feedback),
  };
}

import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import { getCategoryLabel } from "@/domain/feedback/sentiment-analysis";
import {
  formatRelativeDate,
  getAnalysis,
  getTone,
  type FeedbackRecord,
} from "@/domain/feedback/record-analysis";
import type { NotificationDraft } from "./schemas";

function paramsTimeFromFeedback(feedback: FeedbackRecord[]) {
  const latest = feedback[0];
  return latest ? formatRelativeDate(latest.created_at) : "Ahora";
}

export function buildExecutiveNotificationDrafts(
  feedback: FeedbackRecord[],
  params: {
    organizationId: string;
    dateRange: DashboardDateRange;
  },
): NotificationDraft[] {
  if (feedback.length === 0) {
    return [];
  }

  const periodKey = params.dateRange.period;
  const risky = feedback.filter((record) => getTone(record) === "danger");
  const positive = feedback.filter((record) => getTone(record) === "success");
  const branchRiskMap = new Map<
    string,
    {
      branch: string;
      branchId: string | null;
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
      branchId: record.branches?.id ?? null,
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

  const drafts: NotificationDraft[] = [];

  if (topRiskBranch) {
    drafts.push({
      dedupeKey: `manager-risk-summary:${params.organizationId}:${periodKey}`,
      organizationId: params.organizationId,
      branchId: topRiskBranch.branchId,
      audienceType: "organization",
      category: "alert",
      tone: "danger",
      title: `${topRiskBranch.branch} concentra la mayor friccion del periodo`,
      detail:
        topRiskBranch.latestCategory === null
          ? `${topRiskBranch.count} comentarios en riesgo sugieren revisar la operacion de esa sucursal.`
          : `${topRiskBranch.count} comentarios en riesgo apuntan a ${topRiskBranch.latestCategory.toLowerCase()} y conviene revisarlo con gerencia.`,
      href: "/dashboard#alertas",
      metadata: {
        dedupe_key: `manager-risk-summary:${params.organizationId}:${periodKey}`,
        period: periodKey,
      },
    });
  }

  drafts.push({
    dedupeKey: `manager-period-summary:${params.organizationId}:${periodKey}`,
    organizationId: params.organizationId,
    audienceType: "organization",
    category: "summary",
    tone: risky.length > 0 ? "warning" : "success",
    title: `Resumen ejecutivo: ${feedback.length} comentarios en ${feedback.length === 1 ? "el periodo" : "este periodo"}`,
    detail:
      risky.length > 0
        ? `${risky.length} requieren seguimiento y ${positive.length} reflejan una experiencia positiva.`
        : `No hay señales criticas; ${positive.length} reflejan una experiencia positiva y el resto se mantiene estable.`,
    href: "/dashboard#resumen",
    metadata: {
      dedupe_key: `manager-period-summary:${params.organizationId}:${periodKey}`,
      period: periodKey,
      latestAt: paramsTimeFromFeedback(feedback),
    },
  });

  const positiveBranchScores = new Map<
    string,
    {
      branch: string;
      branchId: string | null;
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
      branchId: record.branches?.id ?? null,
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
    drafts.push({
      dedupeKey: `manager-positive-summary:${params.organizationId}:${periodKey}`,
      organizationId: params.organizationId,
      branchId: positiveSummary.branchId,
      audienceType: "organization",
      category: "summary",
      tone: "success",
      title: `${positiveSummary.branch} sostiene la mejor percepcion reciente`,
      detail:
        averageCsat === null
          ? `${positiveSummary.count} comentarios positivos marcan una señal de estabilidad para el gerente.`
          : `${positiveSummary.count} comentarios positivos ayudan a sostener un CSAT general de ${averageCsat.toFixed(1)}/5.`,
      href: "/dashboard#comentarios",
      metadata: {
        dedupe_key: `manager-positive-summary:${params.organizationId}:${periodKey}`,
        period: periodKey,
      },
    });
  }

  return drafts.slice(0, 3);
}

export function buildFeedbackAlertDraft(params: {
  organizationId: string;
  branchId: string;
  branchName: string;
  submissionId: string;
  freeText: string;
  category?: string | null;
  recommendedAction?: string | null;
}): NotificationDraft {
  const excerpt =
    params.freeText.length > 120
      ? `${params.freeText.slice(0, 117).trim()}...`
      : params.freeText;

  return {
    dedupeKey: `feedback-alert:${params.submissionId}`,
    organizationId: params.organizationId,
    branchId: params.branchId,
    audienceType: "organization",
    category: "alert",
    tone: "danger",
    title: `Nuevo comentario en riesgo - ${params.branchName}`,
    detail:
      params.category && params.recommendedAction
        ? `${getCategoryLabel(params.category)}: ${params.recommendedAction}`
        : excerpt,
    href: "/dashboard#comentarios",
    sourceTable: "feedback_submissions",
    sourceId: params.submissionId,
    metadata: {
      dedupe_key: `feedback-alert:${params.submissionId}`,
      branchName: params.branchName,
    },
  };
}

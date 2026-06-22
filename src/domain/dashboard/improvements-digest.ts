import { humanizeCategoryLabel } from "@/domain/feedback/sentiment-analysis";

import type { DashboardCommentRow } from "./schemas";

export type AreaDigestItem = {
  area: string;
  riskCount: number;
  positiveCount: number;
  neutralCount: number;
  riskSample?: string;
  positiveSample?: string;
};

export type BranchDigest = {
  totals: {
    total: number;
    risk: number;
    positive: number;
    neutral: number;
  };
  areas: AreaDigestItem[];
  topRiskAreas: string[];
  topStrengthAreas: string[];
};

export type WeeklyDigestRollup = {
  branchId: string;
  branch: string;
  windowLabel: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  commentFingerprint: string;
  title: string;
  narrative: string;
  urgency: string;
  digest: BranchDigest;
};

function truncateSample(message: string, max = 140): string {
  const trimmed = message.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max).trim()}…`;
}

export function buildCommentFingerprint(comments: DashboardCommentRow[]): string {
  if (comments.length === 0) {
    return "empty";
  }

  return comments
    .map((comment) => comment.id)
    .sort()
    .join("|");
}

export function buildBranchDigest(comments: DashboardCommentRow[]): BranchDigest {
  const areaMap = new Map<string, AreaDigestItem>();

  for (const comment of comments) {
    const area = humanizeCategoryLabel(comment.dominantPattern ?? comment.feedbackType);
    const current = areaMap.get(area) ?? {
      area,
      riskCount: 0,
      positiveCount: 0,
      neutralCount: 0,
    };

    if (comment.sentiment === "Riesgo") {
      current.riskCount += 1;
      if (!current.riskSample) {
        current.riskSample = truncateSample(comment.message);
      }
    } else if (comment.sentiment === "Positivo") {
      current.positiveCount += 1;
      if (!current.positiveSample) {
        current.positiveSample = truncateSample(comment.message);
      }
    } else {
      current.neutralCount += 1;
    }

    areaMap.set(area, current);
  }

  const areas = [...areaMap.values()].sort((left, right) => {
    const leftScore = left.riskCount * 2 + left.positiveCount;
    const rightScore = right.riskCount * 2 + right.positiveCount;
    return rightScore - leftScore;
  });

  const risk = comments.filter((comment) => comment.sentiment === "Riesgo").length;
  const positive = comments.filter((comment) => comment.sentiment === "Positivo").length;
  const neutral = comments.length - risk - positive;

  const topRiskAreas = areas
    .filter((area) => area.riskCount > 0)
    .sort((left, right) => right.riskCount - left.riskCount)
    .slice(0, 3)
    .map((area) => area.area);

  const topStrengthAreas = areas
    .filter((area) => area.positiveCount > 0)
    .sort((left, right) => right.positiveCount - left.positiveCount)
    .slice(0, 3)
    .map((area) => area.area);

  return {
    totals: {
      total: comments.length,
      risk,
      positive,
      neutral,
    },
    areas,
    topRiskAreas,
    topStrengthAreas,
  };
}

export function formatBranchDigestForPrompt(digest: BranchDigest): string {
  if (digest.areas.length === 0) {
    return "Sin señales por área en este periodo.";
  }

  const areaLines = digest.areas
    .slice(0, 6)
    .map((area) => {
      const parts = [
        `${area.area}: ${area.riskCount} riesgo, ${area.positiveCount} positivo, ${area.neutralCount} neutral`,
      ];

      if (area.riskSample) {
        parts.push(`riesgo → "${area.riskSample}"`);
      }

      if (area.positiveSample) {
        parts.push(`fortaleza → "${area.positiveSample}"`);
      }

      return `• ${parts.join(" | ")}`;
    })
    .join("\n");

  return [
    `Totales: ${digest.totals.total} comentarios (${digest.totals.risk} riesgo, ${digest.totals.positive} positivo, ${digest.totals.neutral} neutral)`,
    `Áreas con más riesgo: ${digest.topRiskAreas.join(", ") || "ninguna destacada"}`,
    `Áreas con más fortalezas: ${digest.topStrengthAreas.join(", ") || "ninguna destacada"}`,
    "Detalle por área:",
    areaLines,
  ].join("\n");
}

export function formatWeeklyRollupsForPrompt(rollups: WeeklyDigestRollup[]): string {
  return rollups
    .map((rollup, index) => {
      return [
        `Semana ${index + 1} (${rollup.windowLabel})`,
        `Título previo: ${rollup.title}`,
        `Urgencia previa: ${rollup.urgency}`,
        `Síntesis previa: ${rollup.narrative.replace(/\[\[(.*?)\]\]/g, "$1")}`,
        formatBranchDigestForPrompt(rollup.digest),
      ].join("\n");
    })
    .join("\n\n");
}

import type { DashboardCommentRow } from "./schemas";

export type InformationQualityLabel = "suficiente" | "parcial" | "insuficiente";

export const MONTHLY_USEFUL_RESPONSES_PER_BRANCH = 8;
export const MIN_MONTHLY_USEFUL_RESPONSES = 12;

export type BranchReport = {
  branch: string;
  total: number;
  risk: number;
  positive: number;
  neutral: number;
  insufficient: number;
  partial: number;
  sufficient: number;
  usefulResponses: number;
  targetUsefulResponses: number;
  readinessPercent: number;
  missingUsefulResponses: number;
  topPattern: string;
  recommendedAction: string;
};

export type ReportReadiness = {
  percent: number;
  usefulResponses: number;
  targetUsefulResponses: number;
  missingUsefulResponses: number;
  qualityPercent: number;
  headline: string;
  detail: string;
};

export function classifyInformationQuality(
  comment: DashboardCommentRow,
): InformationQualityLabel {
  if (comment.informationQuality === "sufficient") {
    return "suficiente";
  }

  if (comment.informationQuality === "partial") {
    return "parcial";
  }

  if (comment.informationQuality === "insufficient") {
    return "insuficiente";
  }

  const normalizedMessage = comment.message.toLowerCase();
  const wordCount = normalizedMessage.split(/\s+/).filter(Boolean).length;
  const genericSignals = [
    "hay mucho que mejorar",
    "cosas",
    "algo",
    "varias áreas",
    "varias areas",
    "mejorar",
    "regular",
    "normal",
  ];
  const hasGenericSignal = genericSignals.some((signal) =>
    normalizedMessage.includes(signal),
  );
  const pattern = comment.dominantPattern?.toLowerCase() ?? "";
  const genericPattern =
    pattern === "" ||
    pattern.includes("general") ||
    pattern.includes("otro") ||
    pattern.includes("experiencia del cliente");

  if (wordCount < 8 || (hasGenericSignal && genericPattern)) {
    return "insuficiente";
  }

  if (wordCount < 16 || hasGenericSignal || genericPattern) {
    return "parcial";
  }

  return "suficiente";
}

export function getMostCommonPattern(comments: DashboardCommentRow[]) {
  const counts = new Map<string, number>();

  for (const comment of comments) {
    const pattern = comment.dominantPattern ?? "Experiencia general";
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "Sin patrón suficiente";
}

export function groupCommentsByBranch(comments: DashboardCommentRow[]) {
  const commentsByBranch = new Map<string, DashboardCommentRow[]>();

  for (const comment of comments) {
    const current = commentsByBranch.get(comment.branch) ?? [];
    current.push(comment);
    commentsByBranch.set(comment.branch, current);
  }

  return commentsByBranch;
}

export function buildBranchReports(comments: DashboardCommentRow[]): BranchReport[] {
  const commentsByBranch = groupCommentsByBranch(comments);

  return [...commentsByBranch.entries()]
    .map(([branch, branchComments]) => {
      const qualityCounts = branchComments.reduce(
        (current, comment) => {
          current[classifyInformationQuality(comment)] += 1;
          return current;
        },
        { suficiente: 0, parcial: 0, insuficiente: 0 },
      );
      const risk = branchComments.filter((comment) => comment.sentiment === "Riesgo").length;
      const positive = branchComments.filter(
        (comment) => comment.sentiment === "Positivo",
      ).length;
      const neutral = branchComments.length - risk - positive;
      const targetUsefulResponses = MONTHLY_USEFUL_RESPONSES_PER_BRANCH;
      const usefulResponses = qualityCounts.suficiente + qualityCounts.parcial * 0.5;
      const readinessPercent = Math.min(
        100,
        Math.round((usefulResponses / targetUsefulResponses) * 100),
      );
      const missingUsefulResponses = Math.max(
        0,
        Math.ceil(targetUsefulResponses - usefulResponses),
      );
      const topPattern = getMostCommonPattern(branchComments);
      const recommendedAction =
        missingUsefulResponses > 0
          ? `Faltan ${missingUsefulResponses} valoraciones con motivo claro para un informe mensual más sólido.`
          : "Base suficiente para resumir patrones mensuales con mejor confianza.";
      const captureAction =
        qualityCounts.insuficiente + qualityCounts.parcial >
        Math.ceil(branchComments.length / 2)
          ? " Pedir motivo principal cuando la valoración sea ambigua."
          : risk > positive
            ? " Revisar casos de riesgo y documentar acciones de seguimiento."
            : " Usar los comentarios positivos para repetir prácticas del equipo.";

      return {
        branch,
        total: branchComments.length,
        risk,
        positive,
        neutral,
        insufficient: qualityCounts.insuficiente,
        partial: qualityCounts.parcial,
        sufficient: qualityCounts.suficiente,
        usefulResponses,
        targetUsefulResponses,
        readinessPercent,
        missingUsefulResponses,
        topPattern,
        recommendedAction: `${recommendedAction}${captureAction}`,
      };
    })
    .sort((left, right) => {
      const qualityDiff =
        right.insufficient + right.partial - (left.insufficient + left.partial);
      if (qualityDiff !== 0) return qualityDiff;
      return right.risk - left.risk;
    });
}

export function buildReportReadiness(
  comments: DashboardCommentRow[],
  reports: BranchReport[],
): ReportReadiness {
  if (comments.length === 0 || reports.length === 0) {
    return {
      percent: 0,
      usefulResponses: 0,
      targetUsefulResponses: MIN_MONTHLY_USEFUL_RESPONSES,
      missingUsefulResponses: MIN_MONTHLY_USEFUL_RESPONSES,
      qualityPercent: 0,
      headline: "Sin base suficiente para informe mensual.",
      detail:
        "Aún faltan valoraciones con motivo claro para explicar patrones por establecimiento.",
    };
  }

  const usefulResponses = reports.reduce(
    (sum, report) => sum + report.usefulResponses,
    0,
  );
  const targetUsefulResponses = Math.max(
    MIN_MONTHLY_USEFUL_RESPONSES,
    reports.length * MONTHLY_USEFUL_RESPONSES_PER_BRANCH,
  );
  const clearResponses = reports.reduce((sum, report) => sum + report.sufficient, 0);
  const qualityPercent = Math.round((clearResponses / comments.length) * 100);
  const volumePercent = Math.min(100, (usefulResponses / targetUsefulResponses) * 100);
  const percent = Math.min(
    100,
    Math.round(volumePercent * 0.7 + qualityPercent * 0.3),
  );
  const missingUsefulResponses = Math.max(
    0,
    Math.ceil(targetUsefulResponses - usefulResponses),
  );

  return {
    percent,
    usefulResponses,
    targetUsefulResponses,
    missingUsefulResponses,
    qualityPercent,
    headline:
      percent >= 80
        ? "Base mensual casi lista para un informe defendible."
        : "Todavía falta información clara para un mejor informe mensual.",
    detail:
      missingUsefulResponses > 0
        ? `Faltan ${missingUsefulResponses} valoraciones útiles: respuestas con motivo claro, categoría específica o detalle accionable.`
        : "La base actual permite explicar patrones por sucursal con buena claridad.",
  };
}

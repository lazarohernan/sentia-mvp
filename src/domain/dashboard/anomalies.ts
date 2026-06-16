import type { DashboardCommentRow } from "./schemas";

export type DashboardAnomaly = {
  branch: string;
  title: string;
  detail: string;
  tone: "danger" | "warning";
};

type ScoredDashboardAnomaly = DashboardAnomaly & {
  score: number;
};

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildDashboardAnomalies(
  comments: DashboardCommentRow[],
): DashboardAnomaly[] {
  const datedComments = comments.filter(
    (comment): comment is DashboardCommentRow & { createdAtIso: string } =>
      typeof comment.createdAtIso === "string",
  );

  if (datedComments.length < 6) {
    return [];
  }

  const latestTimestamp = Math.max(
    ...datedComments.map((comment) => new Date(comment.createdAtIso).getTime()),
  );
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  const recentStart = latestTimestamp - windowMs;
  const previousStart = recentStart - windowMs;
  const commentsByBranch = new Map<string, DashboardCommentRow[]>();

  for (const comment of datedComments) {
    const current = commentsByBranch.get(comment.branch) ?? [];
    current.push(comment);
    commentsByBranch.set(comment.branch, current);
  }

  const anomalies: ScoredDashboardAnomaly[] = [];

  for (const [branch, branchComments] of commentsByBranch.entries()) {
    const recent = branchComments.filter((comment) => {
      const time = new Date(comment.createdAtIso ?? "").getTime();
      return time >= recentStart;
    });
    const previous = branchComments.filter((comment) => {
      const time = new Date(comment.createdAtIso ?? "").getTime();
      return time >= previousStart && time < recentStart;
    });

    if (recent.length === 0) {
      continue;
    }

    const recentRisk = recent.filter((comment) => comment.sentiment === "Riesgo").length;
    const previousRisk = previous.filter((comment) => comment.sentiment === "Riesgo").length;
    const recentAverageCsat = average(recent.map((comment) => comment.csatScore));
    const previousAverageCsat = average(previous.map((comment) => comment.csatScore));

    if (recentRisk >= 3 && recentRisk >= Math.max(1, previousRisk * 2)) {
      anomalies.push({
        branch,
        title: `${branch} muestra un salto de riesgo`,
        detail:
          previousRisk > 0
            ? `${recentRisk} señales de riesgo en la ventana reciente, frente a ${previousRisk} en la anterior.`
            : `${recentRisk} señales de riesgo en la ventana reciente sin referencia previa equivalente.`,
        tone: recentRisk >= 5 ? "danger" : "warning",
        score: recentRisk + Math.max(0, recentRisk - previousRisk),
      });
      continue;
    }

    if (
      recentAverageCsat !== null &&
      previousAverageCsat !== null &&
      previousAverageCsat - recentAverageCsat >= 1
    ) {
      anomalies.push({
        branch,
        title: `${branch} cayó en satisfacción reciente`,
        detail: `El CSAT promedio bajó de ${previousAverageCsat.toFixed(1)} a ${recentAverageCsat.toFixed(1)} en la ventana reciente.`,
        tone: previousAverageCsat - recentAverageCsat >= 1.5 ? "danger" : "warning",
        score: (previousAverageCsat - recentAverageCsat) * 4,
      });
      continue;
    }

    const recentLowContext = recent.filter(
      (comment) =>
        comment.informationQuality === "partial" ||
        comment.informationQuality === "insufficient" ||
        !comment.informationQuality,
    ).length;

    if (recent.length >= 4 && recentLowContext / recent.length >= 0.75) {
      anomalies.push({
        branch,
        title: `${branch} está recibiendo señales ambiguas`,
        detail: `${recentLowContext} de ${recent.length} comentarios recientes llegan con poco contexto útil para explicar la causa.`,
        tone: "warning",
        score: recentLowContext,
      });
    }
  }

  return anomalies
    .sort((left, right) => {
      if (left.tone !== right.tone) {
        return left.tone === "danger" ? -1 : 1;
      }

      return right.score - left.score;
    })
    .slice(0, 3)
    .map((anomaly) => ({
      branch: anomaly.branch,
      title: anomaly.title,
      detail: anomaly.detail,
      tone: anomaly.tone,
    }));
}

import { describe, expect, it } from "vitest";

import {
  dedupeOverlappingWeeklyRollups,
  resolveImprovementSourceComments,
  resolveApiGenerationStrategy,
  resolveImprovementPromptStrategy,
} from "./improvements-batch";
import type { WeeklyDigestRollup } from "./improvements-digest";
import type { DashboardCommentRow } from "./schemas";

function rollup(partial: Partial<WeeklyDigestRollup> & Pick<WeeklyDigestRollup, "branchId">): WeeklyDigestRollup {
  return {
    branch: "Centro",
    windowLabel: partial.windowLabel ?? "2026-06-01 a 2026-06-07",
    periodStart: partial.periodStart ?? "2026-06-01",
    periodEnd: partial.periodEnd ?? "2026-06-07",
    generatedAt: partial.generatedAt ?? "2026-06-07T12:00:00.000Z",
    commentFingerprint: partial.commentFingerprint ?? "a|b",
    title: "Título",
    narrative: "Narrativa",
    urgency: "esta semana",
    digest: {
      totals: { total: 2, risk: 1, positive: 1, neutral: 0 },
      areas: [],
      topRiskAreas: [],
      topStrengthAreas: [],
    },
    ...partial,
    branchId: partial.branchId,
  };
}

describe("improvements-batch", () => {
  it("usa prompt mensual comprimido cuando no hay lotes semanales", () => {
    expect(resolveImprovementPromptStrategy("30d", [])).toBe("monthly_compressed");
  });

  it("usa rollup mensual cuando la sucursal sí tiene lotes", () => {
    expect(
      resolveImprovementPromptStrategy("30d", [
        rollup({ branchId: "branch-1" }),
      ]),
    ).toBe("monthly_from_weekly_batches");
  });

  it("reporta estrategia mixta si solo algunas sucursales tienen lotes", () => {
    expect(
      resolveApiGenerationStrategy({
        period: "30d",
        branchCount: 2,
        branchesWithWeeklyRollups: 1,
      }),
    ).toBe("monthly_mixed");
  });

  it("deduplica ventanas solapadas y fingerprints repetidos", () => {
    const deduped = dedupeOverlappingWeeklyRollups([
      rollup({
        branchId: "branch-1",
        periodStart: "2026-06-01",
        periodEnd: "2026-06-07",
        generatedAt: "2026-06-08T12:00:00.000Z",
        commentFingerprint: "a|b",
      }),
      rollup({
        branchId: "branch-1",
        periodStart: "2026-06-03",
        periodEnd: "2026-06-09",
        generatedAt: "2026-06-09T12:00:00.000Z",
        commentFingerprint: "c|d",
      }),
      rollup({
        branchId: "branch-1",
        periodStart: "2026-06-10",
        periodEnd: "2026-06-16",
        generatedAt: "2026-06-16T12:00:00.000Z",
        commentFingerprint: "e|f",
      }),
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped.map((item) => item.periodStart)).toEqual([
      "2026-06-03",
      "2026-06-10",
    ]);
  });

  it("usa la misma semana calendario para generar y persistir el lote semanal", () => {
    const comments: DashboardCommentRow[] = [
      {
        id: "old",
        customer: "Cliente",
        business: "Negocio",
        branch: "Centro",
        branchId: "branch-1",
        feedbackType: "Observación",
        sentiment: "Riesgo",
        csatScore: 2,
        status: "Nuevo",
        message: "Comentario de la semana previa",
        receivedAt: "2026-06-08T12:00:00.000Z",
        createdAtIso: "2026-06-08T12:00:00.000Z",
      },
      {
        id: "current",
        customer: "Cliente",
        business: "Negocio",
        branch: "Centro",
        branchId: "branch-1",
        feedbackType: "Observación",
        sentiment: "Positivo",
        csatScore: 5,
        status: "Nuevo",
        message: "Comentario de la semana actual",
        receivedAt: "2026-06-16T12:00:00.000Z",
        createdAtIso: "2026-06-16T12:00:00.000Z",
      },
    ];

    const weeklyComments = resolveImprovementSourceComments({
      period: "7d",
      comments,
      weeklyWindow: {
        startDate: "2026-06-15",
        endDate: "2026-06-21",
      },
    });

    expect(weeklyComments.map((comment) => comment.id)).toEqual(["current"]);
  });
});

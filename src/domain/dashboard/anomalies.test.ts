import { describe, expect, it } from "vitest";

import type { DashboardCommentRow } from "./schemas";
import { buildDashboardAnomalies } from "./anomalies";

function buildComment(
  overrides: Partial<DashboardCommentRow> = {},
): DashboardCommentRow {
  return {
    id: "comment-1",
    customer: "Cliente anónimo",
    business: "Feedback",
    branch: "Centro",
    feedbackType: "Observación",
    sentiment: "Neutral",
    csatScore: 3,
    status: "Nuevo",
    message: "Comentario",
    receivedAt: "Hace 5 min",
    createdAtIso: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildDashboardAnomalies", () => {
  it("detects a recent risk spike by branch", () => {
    const comments = [
      buildComment({
        id: "p1",
        branch: "Norte",
        sentiment: "Riesgo",
        csatScore: 1,
        createdAtIso: "2026-06-10T12:00:00.000Z",
      }),
      buildComment({
        id: "p2",
        branch: "Norte",
        sentiment: "Riesgo",
        csatScore: 1,
        createdAtIso: "2026-06-09T12:00:00.000Z",
      }),
      buildComment({
        id: "p3",
        branch: "Norte",
        sentiment: "Riesgo",
        csatScore: 2,
        createdAtIso: "2026-06-08T12:00:00.000Z",
      }),
      buildComment({
        id: "a1",
        branch: "Norte",
        sentiment: "Neutral",
        csatScore: 4,
        createdAtIso: "2026-05-30T12:00:00.000Z",
      }),
      buildComment({
        id: "a2",
        branch: "Centro",
        sentiment: "Neutral",
        csatScore: 3,
        createdAtIso: "2026-06-10T12:00:00.000Z",
      }),
      buildComment({
        id: "a3",
        branch: "Centro",
        sentiment: "Neutral",
        csatScore: 3,
        createdAtIso: "2026-06-09T12:00:00.000Z",
      }),
    ];

    const anomalies = buildDashboardAnomalies(comments);

    expect(anomalies[0]?.branch).toBe("Norte");
    expect(anomalies[0]?.title).toContain("salto de riesgo");
  });
});

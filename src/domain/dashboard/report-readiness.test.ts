import { describe, expect, it } from "vitest";

import type { DashboardCommentRow } from "./schemas";
import {
  buildBranchReports,
  buildExecutiveReportSummary,
  buildReportReadiness,
} from "./report-readiness";

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
    message: "La experiencia estuvo bien, pero no explica con claridad qué pasó.",
    receivedAt: "Hace 5 min",
    dominantPattern: "Experiencia general",
    ...overrides,
  };
}

describe("buildExecutiveReportSummary", () => {
  it("marks the period as still in preparation when the data is ambiguous", () => {
    const comments = [
      buildComment({
        branch: "Norte",
        message: "Estuvo bien, pero hay mucho que mejorar.",
        informationQuality: "insufficient",
      }),
      buildComment({
        id: "comment-2",
        branch: "Norte",
        message: "Regular, podrían mejorar varias áreas.",
        informationQuality: "partial",
      }),
      buildComment({
        id: "comment-3",
        branch: "Centro",
        message: "Normal, faltan cosas.",
        informationQuality: "insufficient",
      }),
    ];
    const reports = buildBranchReports(comments);
    const readiness = buildReportReadiness(comments, reports);

    const summary = buildExecutiveReportSummary({
      comments,
      reports,
      readiness,
    });

    expect(summary.headline).toContain("Norte");
    expect(summary.generatedLabel).toBe("Lectura automática en preparación");
    expect(summary.nextStep).toContain("Faltan");
  });

  it("marks the period as ready when the dataset already explains patterns", () => {
    const comments = Array.from({ length: 12 }, (_, index) =>
      buildComment({
        id: `comment-${index + 1}`,
        branch: "Centro",
        sentiment: index < 3 ? "Riesgo" : "Positivo",
        informationQuality: "sufficient",
        message:
          "El cliente explicó claramente que la atención fue lenta al inicio, pero luego el equipo resolvió el pedido y detalló la causa del retraso.",
        dominantPattern: "Tiempo de espera",
      }),
    );
    const reports = buildBranchReports(comments);
    const readiness = buildReportReadiness(comments, reports);

    const summary = buildExecutiveReportSummary({
      comments,
      reports,
      readiness,
      insight: {
        detail: "La sucursal necesita revisar tiempos de espera.",
        action: "Revisar turnos de apertura y documentar el ajuste.",
      },
    });

    expect(summary.headline).toBe(
      "El periodo ya permite explicar patrones con buena claridad.",
    );
    expect(summary.generatedLabel).toBe("Lectura automática lista");
    expect(summary.nextStep).toBe(
      "Revisar turnos de apertura y documentar el ajuste.",
    );
  });
});

import { describe, expect, it } from "vitest";

import type { AgentContextSnapshot } from "./context";
import { buildOperationalReportFromOutput } from "./operational-report";

const context: AgentContextSnapshot = {
  organizationId: "22222222-2222-4222-8222-222222222222",
  period: "30d",
  commentsCount: 12,
  generatedAt: "2026-08-03T00:00:00.000Z",
  readinessPercent: 80,
  qualityPercent: 75,
  missingUsefulResponses: 0,
  priorityBranch: null,
  branchReports: [],
  recentComments: [],
  dashboardComments: [],
  knowledge: {
    peakHours: null,
    servicePriorities: null,
    compensationPolicy: null,
    followUpTone: null,
    agentNotes: null,
  },
};

describe("buildOperationalReportFromOutput", () => {
  it("accepts only the expected report structure", () => {
    const report = buildOperationalReportFromOutput(
      {
        headline: "La operación muestra una mejora",
        summary: "Los comentarios permiten identificar un patrón operativo claro.",
        nextActions: ["Revisar el flujo de caja esta semana."],
        deliveryReadiness: "La base ya permite compartir el informe.",
      },
      context,
    );

    expect(report.headline).toBe("La operación muestra una mejora");
    expect(report.nextActions).toHaveLength(1);
  });

  it("uses a safe report when the output is invalid", () => {
    const report = buildOperationalReportFromOutput(
      { headline: "Sin campos suficientes" },
      context,
    );

    expect(report.headline).toContain("necesita revisión");
    expect(report.nextActions).toHaveLength(3);
  });
});

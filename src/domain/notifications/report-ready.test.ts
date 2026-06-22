import { describe, expect, it } from "vitest";

import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardCommentRow } from "@/domain/dashboard/schemas";

import { buildReportReadyNotificationDrafts } from "./report-ready";

function buildComment(
  overrides: Partial<DashboardCommentRow> = {},
): DashboardCommentRow {
  return {
    id: "comment-1",
    customer: "Cliente anónimo",
    business: "Feedback",
    branch: "Centro",
    feedbackType: "Observación",
    sentiment: "Positivo",
    csatScore: 4,
    status: "Nuevo",
    message:
      "El cliente explicó claramente que la atención fue lenta al inicio, pero luego el equipo resolvió el pedido y detalló la causa del retraso.",
    receivedAt: "Hace 5 min",
    dominantPattern: "Tiempo de espera",
    informationQuality: "sufficient",
    ...overrides,
  };
}

describe("buildReportReadyNotificationDrafts", () => {
  it("creates a notification when the monthly report is ready", () => {
    const comments = Array.from({ length: 12 }, (_, index) =>
      buildComment({
        id: `comment-${index + 1}`,
        branch: "Centro",
      }),
    );

    const drafts = buildReportReadyNotificationDrafts({
      organizationId: "org-1",
      dateRange: getDashboardDateRange({ period: "30d" }),
      reportCadence: "monthly",
      comments,
    });

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.title).toBe("Informe mensual listo para compartir");
    expect(drafts[0]?.href).toBe(
      "/dashboard?reportPeriod=monthly&openReport=1#informes",
    );
    expect(drafts[0]?.tone).toBe("success");
  });

  it("creates weekly and monthly notifications when cadence is both", () => {
    const comments = Array.from({ length: 12 }, (_, index) =>
      buildComment({
        id: `comment-${index + 1}`,
        branch: "Centro",
      }),
    );

    const drafts = buildReportReadyNotificationDrafts({
      organizationId: "org-1",
      dateRange: getDashboardDateRange({ period: "30d" }),
      reportCadence: "both",
      comments,
    });

    expect(drafts).toHaveLength(2);
    expect(drafts.map((draft) => draft.title)).toEqual([
      "Informe semanal listo para compartir",
      "Informe mensual listo para compartir",
    ]);
  });

  it("skips notifications when the report still lacks useful responses", () => {
    const drafts = buildReportReadyNotificationDrafts({
      organizationId: "org-1",
      dateRange: getDashboardDateRange({ period: "7d" }),
      reportCadence: "weekly",
      comments: [
        buildComment({
          message: "Regular.",
          informationQuality: "insufficient",
        }),
      ],
    });

    expect(drafts).toHaveLength(0);
  });
});

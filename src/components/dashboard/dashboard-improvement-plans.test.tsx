import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";

import { DashboardImprovementPlans } from "./dashboard-improvement-plans";

function buildDashboardData(): DashboardSummaryData {
  return {
    scope: "2 sucursales",
    period: "Últimos 30 días",
    dateRange: getDashboardDateRange({ period: "30d" }),
    metrics: [],
    insight: null,
    attentionItems: [],
    branchHealth: [],
    recentComments: [],
    notifications: [],
    followUpMetrics: {
      openCount: 0,
      escalatedCount: 0,
      inReviewCount: 0,
      slaBreachedCount: 0,
      resolvedCount: 0,
      avgResponseHours: null,
      avgResolutionHours: null,
    },
    qrScanCounts: {},
    comments: [
      {
        id: "c1",
        customer: "Cliente",
        business: "Feedback",
        branch: "Centro",
        branchId: "branch-1",
        feedbackType: "Observación",
        sentiment: "Riesgo",
        csatScore: 2,
        status: "Nuevo",
        message: "Sucursal 1",
        receivedAt: "2026-06-10T12:00:00.000Z",
        createdAtIso: "2026-06-10T12:00:00.000Z",
      },
      {
        id: "c2",
        customer: "Cliente",
        business: "Feedback",
        branch: "Centro",
        branchId: "branch-2",
        feedbackType: "Observación",
        sentiment: "Positivo",
        csatScore: 5,
        status: "Nuevo",
        message: "Sucursal 2",
        receivedAt: "2026-06-11T12:00:00.000Z",
        createdAtIso: "2026-06-11T12:00:00.000Z",
      },
    ],
  };
}

describe("DashboardImprovementPlans", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("permite cambiar entre narrativas aunque dos sucursales compartan nombre", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          narratives: [
            {
              branchId: "branch-1",
              branch: "Centro",
              title: "Narrativa A",
              narrative: "Contenido A",
              urgency: "esta semana",
              generatedByLlm: true,
            },
            {
              branchId: "branch-2",
              branch: "Centro",
              title: "Narrativa B",
              narrative: "Contenido B",
              urgency: "próximo ciclo",
              generatedByLlm: true,
            },
          ],
        }),
      ),
    );

    render(<DashboardImprovementPlans dashboardData={buildDashboardData()} />);

    await waitFor(() => {
      expect(screen.getByText("Narrativa A")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button", { name: "Centro" });
    fireEvent.click(buttons[1]!);

    expect(screen.getByText("Narrativa B")).toBeInTheDocument();
    expect(screen.queryByText("Narrativa A")).not.toBeInTheDocument();
  });
});

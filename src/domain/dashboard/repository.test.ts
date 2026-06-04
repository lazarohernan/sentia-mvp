import { describe, expect, it, vi } from "vitest";

import type { Branch } from "@/domain/branches/schemas";
import type { FeedbackRecord } from "@/domain/feedback/record-analysis";
import { getDashboardSummaryData } from "./repository";

const branch: Branch = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "22222222-2222-4222-8222-222222222222",
  name: "Mall Norte",
  slug: "mall-norte",
  address: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

function feedbackRecord(index: number): FeedbackRecord {
  return {
    id: `feedback-${index}`,
    type: "compliment",
    emotion_score: 5,
    csat_score: 5,
    free_text: `Comentario positivo ${index}`,
    contact_name: null,
    workflow_status: "nuevo",
    assigned_user_id: null,
    first_response_at: null,
    resolved_at: null,
    created_at: new Date(Date.UTC(2026, 0, 2, 12, index % 60)).toISOString(),
    branch_id: branch.id,
    branches: {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      organization_id: branch.organization_id,
    },
    ai_analyses: [],
  };
}

describe("getDashboardSummaryData", () => {
  it("calculates executive metrics from every feedback page in the date range", async () => {
    const records = Array.from({ length: 1001 }, (_, index) => feedbackRecord(index));

    const feedbackQuery = {
      select: vi.fn(() => feedbackQuery),
      in: vi.fn(() => feedbackQuery),
      gte: vi.fn(() => feedbackQuery),
      lte: vi.fn(() => feedbackQuery),
      order: vi.fn(() => feedbackQuery),
      limit: vi.fn(async () => ({
        data: records.slice(0, 100),
        error: null,
      })),
      range: vi.fn(async (from: number, to: number) => ({
        data: records.slice(from, to + 1),
        error: null,
      })),
    };
    const analysesQuery = {
      select: vi.fn(() => analysesQuery),
      in: vi.fn(() => analysesQuery),
      order: vi.fn(async () => ({
        data: [],
        error: null,
      })),
    };

    const client = {
      from: vi.fn((table: string) =>
        table === "ai_analyses" ? analysesQuery : feedbackQuery,
      ),
    } as unknown as Parameters<typeof getDashboardSummaryData>[0];

    const data = await getDashboardSummaryData(client, {
      branches: [branch],
      dateRange: {
        period: "custom",
        label: "Rango personalizado",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        startIso: "2026-01-01T06:00:00.000Z",
        endIso: "2026-01-03T05:59:59.999Z",
      },
    });

    expect(data.metrics[0]).toMatchObject({
      label: "Comentarios",
      value: "1,001",
    });
    expect(data.branchHealth[0]).toMatchObject({
      branch: "Mall Norte",
      comments: "1001 comentarios",
      scoredCount: 1001,
    });
    expect(feedbackQuery.range).toHaveBeenCalledTimes(2);
  });

  it("maps stored AI analysis into dashboard comments", async () => {
    const records = [feedbackRecord(1)];
    records[0].type = "observation";
    records[0].csat_score = 3;
    records[0].free_text =
      "Estuvo excelente, pero hay mucho que mejorar.";

    const feedbackQuery = {
      select: vi.fn(() => feedbackQuery),
      in: vi.fn(() => feedbackQuery),
      gte: vi.fn(() => feedbackQuery),
      lte: vi.fn(() => feedbackQuery),
      order: vi.fn(() => feedbackQuery),
      range: vi.fn(async () => ({
        data: records,
        error: null,
      })),
    };
    const analysesQuery = {
      select: vi.fn(() => analysesQuery),
      in: vi.fn(() => analysesQuery),
      order: vi.fn(async () => ({
        data: [
          {
            submission_id: "feedback-1",
            status: "completed",
            sentiment: "neutral",
            urgency: "low",
            category: "other",
            summary:
              "El cliente reconoce aspectos positivos, pero ve oportunidades de mejora.",
            recommended_action:
              "Revisar con el equipo las áreas específicas que pueden mejorar.",
            model_used: "gpt-4.1-mini",
            confidence: 0.85,
          },
        ],
        error: null,
      })),
    };

    const client = {
      from: vi.fn((table: string) =>
        table === "ai_analyses" ? analysesQuery : feedbackQuery,
      ),
    } as unknown as Parameters<typeof getDashboardSummaryData>[0];

    const data = await getDashboardSummaryData(client, {
      branches: [branch],
      dateRange: {
        period: "custom",
        label: "Rango personalizado",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        startIso: "2026-01-01T06:00:00.000Z",
        endIso: "2026-01-03T05:59:59.999Z",
      },
    });

    expect(data.comments[0]).toMatchObject({
      analysisSummary:
        "El cliente reconoce aspectos positivos, pero ve oportunidades de mejora.",
      recommendedAction:
        "Revisar con el equipo las áreas específicas que pueden mejorar.",
      analysisModel: "gpt-4.1-mini",
      analysisConfidence: "85% confianza",
    });
    expect(analysesQuery.in).toHaveBeenCalledWith("submission_id", [
      "feedback-1",
    ]);
  });
});

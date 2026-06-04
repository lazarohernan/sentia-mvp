import { describe, expect, it } from "vitest";

import { computeFollowUpMetrics, getWorkflowStatusForRecord } from "./follow-up";
import type { FeedbackRecord } from "./record-analysis";

function buildRecord(
  overrides: Partial<FeedbackRecord> = {},
): FeedbackRecord {
  return {
    id: "sub-1",
    type: "complaint",
    emotion_score: 2,
    csat_score: 2,
    free_text: "Mala experiencia",
    contact_name: null,
    created_at: "2026-06-01T10:00:00.000Z",
    branch_id: "branch-1",
    branches: null,
    ai_analyses: [
      {
        status: "completed",
        sentiment: "negative",
        urgency: "high",
        category: "Servicio",
        summary: null,
        recommended_action: null,
        confidence: 0.9,
      },
    ],
    ...overrides,
  };
}

describe("getWorkflowStatusForRecord", () => {
  it("prefers persisted workflow status", () => {
    const status = getWorkflowStatusForRecord(
      buildRecord({ workflow_status: "en_proceso" }),
    );

    expect(status).toBe("en_proceso");
  });

  it("infers status from AI when workflow is missing", () => {
    const status = getWorkflowStatusForRecord(buildRecord());

    expect(status).toBe("en_revision");
  });
});

describe("computeFollowUpMetrics", () => {
  it("counts open cases and averages response time", () => {
    const metrics = computeFollowUpMetrics([
      buildRecord({
        workflow_status: "en_revision",
        first_response_at: "2026-06-01T12:00:00.000Z",
      }),
      buildRecord({
        workflow_status: "resuelto",
        created_at: "2026-06-02T11:00:00.000Z",
        first_response_at: "2026-06-02T12:00:00.000Z",
        resolved_at: "2026-06-02T14:00:00.000Z",
      }),
    ]);

    expect(metrics.openCount).toBe(1);
    expect(metrics.resolvedCount).toBe(1);
    expect(metrics.avgResponseHours).toBe(1.5);
    expect(metrics.avgResolutionHours).toBe(3);
  });
});

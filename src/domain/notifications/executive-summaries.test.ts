import { describe, expect, it } from "vitest";

import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { FeedbackRecord } from "@/domain/feedback/record-analysis";
import {
  buildExecutiveNotificationDrafts,
  buildFeedbackAlertDraft,
} from "./executive-summaries";

const baseFeedback: FeedbackRecord = {
  id: "feedback-1",
  type: "complaint",
  emotion_score: 2,
  csat_score: 1,
  free_text: "Mala experiencia en caja",
  contact_name: null,
  created_at: new Date().toISOString(),
  branch_id: "branch-1",
  branches: {
    id: "branch-1",
    name: "Sucursal Centro",
    slug: "sucursal-centro",
    organization_id: "org-1",
  },
  ai_analyses: [
    {
      status: "completed",
      sentiment: "negative",
      urgency: "high",
      category: "Tiempo de espera",
      summary: "Cliente reporta demora prolongada",
      probable_cause: "Falta de apoyo en caja.",
      recommended_action: "Revisar personal en caja",
      suggested_owner: "Gerencia de turno",
      suggested_sla: "Hoy mismo",
      requires_contact: true,
      information_quality: "sufficient",
      follow_up_question: null,
      follow_up_answer: null,
      model_used: "gpt-4.1-mini",
      confidence: 0.91,
    },
  ],
};

describe("buildExecutiveNotificationDrafts", () => {
  it("creates deduped executive notification drafts", () => {
    const dateRange = getDashboardDateRange({ period: "7d" });
    const drafts = buildExecutiveNotificationDrafts([baseFeedback], {
      organizationId: "org-1",
      dateRange,
    });

    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.dedupeKey).toContain("manager-risk-summary:org-1:");
    expect(drafts[1]?.dedupeKey).toContain("manager-period-summary:org-1:");
    expect(drafts[0]?.category).toBe("alert");
  });

  it("does not merge branches that share the same name", () => {
    const dateRange = getDashboardDateRange({ period: "7d" });
    const drafts = buildExecutiveNotificationDrafts(
      [
        baseFeedback,
        {
          ...baseFeedback,
          id: "feedback-2",
          branch_id: "branch-2",
          branches: {
            id: "branch-2",
            name: "Sucursal Centro",
            slug: "sucursal-centro-2",
            organization_id: "org-1",
          },
        },
      ],
      {
        organizationId: "org-1",
        dateRange,
      },
    );

    expect(drafts[0]?.branchId).toBe("branch-1");
    expect(drafts[0]?.detail).toContain("1 comentarios");
  });
});

describe("buildFeedbackAlertDraft", () => {
  it("links alerts to feedback submissions", () => {
    const draft = buildFeedbackAlertDraft({
      organizationId: "org-1",
      branchId: "branch-1",
      branchName: "Sucursal Centro",
      submissionId: "feedback-1",
      freeText: "Mala experiencia en caja",
      category: "Tiempo de espera",
      recommendedAction: "Revisar personal en caja",
    });

    expect(draft.dedupeKey).toBe("feedback-alert:feedback-1");
    expect(draft.sourceTable).toBe("feedback_submissions");
    expect(draft.sourceId).toBe("feedback-1");
    expect(draft.category).toBe("alert");
  });
});

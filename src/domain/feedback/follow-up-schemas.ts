import { z } from "zod";

import { sanitizeOptionalTextInput } from "@/lib/security/input";
import { workflowStatusValues, type WorkflowStatus } from "./workflow-status";

export const updateFeedbackFollowUpInputSchema = z.object({
  status: z.enum(workflowStatusValues).optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  note: z
    .preprocess(
      (value) => {
        if (value === null || value === undefined) {
          return undefined;
        }

        if (typeof value !== "string") {
          return undefined;
        }

        const sanitized = sanitizeOptionalTextInput(value);
        return sanitized && sanitized.length > 0 ? sanitized.slice(0, 1000) : undefined;
      },
      z.string().min(1).max(1000).optional(),
    )
    .optional(),
});

export type UpdateFeedbackFollowUpInput = z.infer<
  typeof updateFeedbackFollowUpInputSchema
>;

export type FeedbackFollowUpAction = {
  id: string;
  submissionId: string;
  actionType: "status_change" | "note" | "assignment" | "escalation";
  previousStatus: WorkflowStatus | null;
  newStatus: WorkflowStatus | null;
  note: string | null;
  actorName: string;
  createdAt: string;
};

export type FeedbackFollowUpMetrics = {
  openCount: number;
  escalatedCount: number;
  inReviewCount: number;
  resolvedCount: number;
  slaBreachedCount: number;
  avgResponseHours: number | null;
  avgResolutionHours: number | null;
};

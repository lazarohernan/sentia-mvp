import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type {
  FeedbackFollowUpAction,
  FeedbackFollowUpMetrics,
  UpdateFeedbackFollowUpInput,
} from "./follow-up-schemas";
import type { FeedbackRecord } from "./record-analysis";
import {
  getTone,
  getAnalysis,
} from "./record-analysis";
import {
  inferWorkflowStatusFromSignals,
  isWorkflowStatus,
  workflowStatusToLabel,
  type WorkflowStatus,
} from "./workflow-status";

type Client = SupabaseClient<Database>;

type FollowUpSubmissionRow = {
  id: string;
  branch_id: string;
  workflow_status: string;
  assigned_user_id: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  branches: {
    organization_id: string;
  } | null;
};

type FollowUpActionRow = {
  id: string;
  submission_id: string;
  action_type: FeedbackFollowUpAction["actionType"];
  previous_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
};

export function getWorkflowStatusForRecord(
  record: Pick<FeedbackRecord, "workflow_status" | "ai_analyses" | "csat_score">,
): WorkflowStatus {
  if (record.workflow_status && isWorkflowStatus(record.workflow_status)) {
    return record.workflow_status;
  }

  const analysis = getAnalysis(record as FeedbackRecord);
  return inferWorkflowStatusFromSignals({
    urgency: analysis?.urgency ?? null,
    tone: getTone(record as FeedbackRecord),
  });
}

export function getCommentStatusLabel(
  record: Pick<FeedbackRecord, "workflow_status" | "ai_analyses" | "csat_score">,
) {
  return workflowStatusToLabel(getWorkflowStatusForRecord(record));
}

export function canAccessFeedbackBranch(
  actorBranchId: string | null,
  feedbackBranchId: string,
): boolean {
  return !actorBranchId || actorBranchId === feedbackBranchId;
}

function hoursBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }

  return (end - start) / 3_600_000;
}

export function computeFollowUpMetrics(
  feedback: Array<
    Pick<
      FeedbackRecord,
      | "workflow_status"
      | "created_at"
      | "first_response_at"
      | "resolved_at"
      | "ai_analyses"
      | "csat_score"
    >
  >,
): FeedbackFollowUpMetrics {
  let openCount = 0;
  let escalatedCount = 0;
  let inReviewCount = 0;
  let resolvedCount = 0;
  const responseHours: number[] = [];
  const resolutionHours: number[] = [];

  for (const record of feedback) {
    const status = getWorkflowStatusForRecord(record);

    if (status === "resuelto") {
      resolvedCount += 1;
    } else {
      openCount += 1;
    }

    if (status === "escalado") {
      escalatedCount += 1;
    }

    if (status === "en_revision" || status === "en_proceso") {
      inReviewCount += 1;
    }

    if (record.first_response_at) {
      responseHours.push(hoursBetween(record.created_at, record.first_response_at));
    }

    if (record.resolved_at) {
      resolutionHours.push(hoursBetween(record.created_at, record.resolved_at));
    }
  }

  const average = (values: number[]) =>
    values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  return {
    openCount,
    escalatedCount,
    inReviewCount,
    resolvedCount,
    avgResponseHours: average(responseHours),
    avgResolutionHours: average(resolutionHours),
  };
}

function mapActionRow(row: FollowUpActionRow): FeedbackFollowUpAction {
  return {
    id: row.id,
    submissionId: row.submission_id,
    actionType: row.action_type,
    previousStatus:
      row.previous_status && isWorkflowStatus(row.previous_status)
        ? row.previous_status
        : null,
    newStatus:
      row.new_status && isWorkflowStatus(row.new_status) ? row.new_status : null,
    note: row.note,
    actorName: row.profiles?.full_name?.trim() || "Equipo",
    createdAt: row.created_at,
  };
}

export async function getFeedbackFollowUpActions(
  client: Client,
  submissionId: string,
  scope?: {
    organizationId: string;
    actorBranchId?: string | null;
  },
): Promise<FeedbackFollowUpAction[]> {
  if (scope) {
    const submission = await getSubmissionForFollowUp(client, submissionId);
    if (!submission?.branches) {
      return [];
    }

    if (submission.branches.organization_id !== scope.organizationId) {
      return [];
    }

    if (!canAccessFeedbackBranch(scope.actorBranchId ?? null, submission.branch_id)) {
      return [];
    }
  }

  const { data, error } = await client
    .from("feedback_follow_up_actions")
    .select(
      `
        id,
        submission_id,
        action_type,
        previous_status,
        new_status,
        note,
        created_at,
        profiles(full_name)
      `,
    )
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return [];
  }

  return (data as FollowUpActionRow[]).map(mapActionRow);
}

async function getSubmissionForFollowUp(
  client: Client,
  submissionId: string,
): Promise<FollowUpSubmissionRow | null> {
  const { data, error } = await client
    .from("feedback_submissions")
    .select(
      `
        id,
        branch_id,
        workflow_status,
        assigned_user_id,
        first_response_at,
        resolved_at,
        created_at,
        branches!inner(organization_id)
      `,
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FollowUpSubmissionRow;
}

export async function updateFeedbackFollowUp(
  client: Client,
  params: {
    submissionId: string;
    organizationId: string;
    actorUserId: string;
    actorBranchId?: string | null;
    input: UpdateFeedbackFollowUpInput;
  },
): Promise<{
  workflowStatus: WorkflowStatus;
  actions: FeedbackFollowUpAction[];
} | null> {
  if (!params.input.status && !params.input.note) {
    return null;
  }

  const submission = await getSubmissionForFollowUp(client, params.submissionId);
  if (!submission?.branches) {
    return null;
  }

  if (submission.branches.organization_id !== params.organizationId) {
    return null;
  }

  if (!canAccessFeedbackBranch(params.actorBranchId ?? null, submission.branch_id)) {
    return null;
  }

  const currentStatus = isWorkflowStatus(submission.workflow_status)
    ? submission.workflow_status
    : "nuevo";
  const nextStatus = params.input.status ?? currentStatus;
  const nowIso = new Date().toISOString();

  const updatePayload: Database["public"]["Tables"]["feedback_submissions"]["Update"] =
    {
      workflow_status: nextStatus,
    };

  if (currentStatus === "nuevo" && nextStatus !== "nuevo" && !submission.first_response_at) {
    updatePayload.first_response_at = nowIso;
  }

  if (nextStatus === "resuelto") {
    updatePayload.resolved_at = submission.resolved_at ?? nowIso;
  } else if (currentStatus === "resuelto") {
    updatePayload.resolved_at = null;
  }

  if (params.input.status) {
    const { error: updateError } = await client
      .from("feedback_submissions")
      .update(updatePayload as never)
      .eq("id", params.submissionId);

    if (updateError) {
      return null;
    }

    const actionType =
      nextStatus === "escalado" ? "escalation" : "status_change";

    const { error: actionError } = await client
      .from("feedback_follow_up_actions")
      .insert({
        submission_id: params.submissionId,
        organization_id: params.organizationId,
        actor_user_id: params.actorUserId,
        action_type: actionType,
        previous_status: currentStatus,
        new_status: nextStatus,
        note: params.input.note ?? null,
      } as never);

    if (actionError) {
      return null;
    }
  } else if (params.input.note) {
    const { error: actionError } = await client
      .from("feedback_follow_up_actions")
      .insert({
        submission_id: params.submissionId,
        organization_id: params.organizationId,
        actor_user_id: params.actorUserId,
        action_type: "note",
        previous_status: currentStatus,
        new_status: currentStatus,
        note: params.input.note,
      } as never);

    if (actionError) {
      return null;
    }
  }

  const actions = await getFeedbackFollowUpActions(client, params.submissionId, {
    organizationId: params.organizationId,
    actorBranchId: params.actorBranchId,
  });

  return {
    workflowStatus: nextStatus,
    actions,
  };
}

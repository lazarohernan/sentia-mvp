import { insertAiUsageEvent } from "@/domain/ai-usage/repository";
import { insertAiAnalysis, insertFeedbackSubmission } from "@/domain/feedback/repository";
import { analyzeFeedbackSentiment } from "@/domain/feedback/sentiment-analysis";
import { feedbackSubmissionSchema } from "@/domain/feedback/schemas";
import { verifyBranchQrTokenSignature } from "@/domain/branches/qr-token";
import { buildFeedbackAlertDraft } from "@/domain/notifications/executive-summaries";
import { upsertNotificationDraft } from "@/domain/notifications/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

type ResolvedBranch = {
  id: string;
  name: string;
  slug?: string;
  organization_id: string;
};

async function resolveFeedbackBranch(
  db: ReturnType<typeof createServiceClient>,
  payload: {
    branchSlug: string;
    branchId: string;
    branchToken: string;
  },
): Promise<
  | { status: "ok"; branch: ResolvedBranch }
  | { status: "not_found" | "invalid_token" }
> {
  if (!hasQrSigningSecret()) {
    return { status: "invalid_token" };
  }

  const { data } = await db
    .from("branches")
    .select("*")
    .eq("id", payload.branchId)
    .eq("is_active", true)
    .maybeSingle();
  const branch = data as ResolvedBranch | null;

  if (!branch) {
    return { status: "not_found" };
  }

  const isValid = verifyBranchQrTokenSignature(payload.branchToken, {
    branchId: branch.id,
    branchSlug: branch.slug ?? payload.branchSlug,
    organizationId: branch.organization_id,
  });

  if (!isValid) {
    return { status: "invalid_token" };
  }

  return { status: "ok", branch };
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:feedback:create",
    key: clientIp,
    limit: 25,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return Response.json(
      {
        status: "error",
        message: "Too many requests. Please try again later.",
      },
      { status: 429 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { status: "error", message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = feedbackSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        status: "error",
        message: "Invalid feedback payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const sentimentAnalysis = await analyzeFeedbackSentiment(parsed.data);

  if (!hasSupabaseServiceEnv()) {
    return Response.json(
      {
        status: "error",
        message: "Feedback persistence is not configured.",
      },
      { status: 503 },
    );
  }

  const db = createServiceClient();
  const branchResult = await resolveFeedbackBranch(db, parsed.data);

  if (branchResult.status === "not_found") {
    return Response.json(
      {
        status: "error",
        message: "Branch not found or inactive.",
      },
      { status: 404 },
    );
  }

  if (branchResult.status === "invalid_token") {
    return Response.json(
      {
        status: "error",
        message: "Invalid feedback link.",
      },
      { status: 403 },
    );
  }

  if (branchResult.status !== "ok") {
    return Response.json(
      {
        status: "error",
        message: "Could not resolve feedback branch.",
      },
      { status: 500 },
    );
  }

  const branch = branchResult.branch;
  let submissionId: string;

  try {
    submissionId = await insertFeedbackSubmission(db, {
      branch_id: branch.id,
      type: parsed.data.type,
      emotion_score: parsed.data.emotionScore,
      csat_score: parsed.data.csatScore ?? null,
      nps_score: parsed.data.npsScore ?? null,
      free_text: parsed.data.freeText,
      contact_name: parsed.data.contact?.name ?? null,
      contact_phone: parsed.data.contact?.phone ?? null,
      contact_email: parsed.data.contact?.email ?? null,
      consent_accepted: parsed.data.consentAccepted,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Could not persist feedback.",
      },
      { status: 500 },
    );
  }

  try {
    await insertAiAnalysis(db, submissionId, {
      status: sentimentAnalysis.status,
      model: sentimentAnalysis.model,
      analysis:
        sentimentAnalysis.status === "completed"
          ? sentimentAnalysis.analysis
          : undefined,
      confidence:
        sentimentAnalysis.status === "completed"
          ? sentimentAnalysis.confidence
          : undefined,
    });
  } catch {
    // AI persistence should not block feedback acceptance.
  }

  if (sentimentAnalysis.status === "completed" && sentimentAnalysis.usageEstimate) {
    try {
      await insertAiUsageEvent(db, {
        organizationId: branch.organization_id,
        branchId: branch.id,
        submissionId,
        useCase: "feedback_triage",
        provider: "openai",
        model: sentimentAnalysis.model,
        operation: "responses.create",
        estimate: sentimentAnalysis.usageEstimate,
        rawUsage: sentimentAnalysis.rawUsage,
      });
    } catch {
      // Usage telemetry should not block feedback acceptance.
    }
  }

  const isRiskyFeedback =
    (parsed.data.csatScore !== undefined && parsed.data.csatScore <= 2) ||
    (sentimentAnalysis.status === "completed" &&
      sentimentAnalysis.analysis?.sentiment === "negative");

  if (isRiskyFeedback) {
    try {
      await upsertNotificationDraft(
        db,
        buildFeedbackAlertDraft({
          organizationId: branch.organization_id,
          branchId: branch.id,
          branchName: branch.name,
          submissionId,
          freeText: parsed.data.freeText,
          category:
            sentimentAnalysis.status === "completed"
              ? sentimentAnalysis.analysis?.category
              : null,
          recommendedAction:
            sentimentAnalysis.status === "completed"
              ? sentimentAnalysis.analysis?.recommendedAction
              : null,
        }),
      );
    } catch {
      // Notification sync should not block feedback acceptance.
    }
  }

  return Response.json(
    {
      status: "accepted",
      analysisStatus: sentimentAnalysis.status,
      sentimentAnalysis,
      feedback: {
        branchSlug: parsed.data.branchSlug,
        type: parsed.data.type,
        emotionScore: parsed.data.emotionScore,
        csatScore: parsed.data.csatScore,
      },
    },
    { status: 202 },
  );
}

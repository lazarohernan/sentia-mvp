import { insertAiAnalysis, insertFeedbackSubmission } from "@/domain/feedback/repository";
import { analyzeFeedbackSentiment } from "@/domain/feedback/sentiment-analysis";
import { feedbackSubmissionSchema } from "@/domain/feedback/schemas";
import { buildFeedbackAlertDraft } from "@/domain/notifications/executive-summaries";
import { upsertNotificationDraft } from "@/domain/notifications/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
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

  const serviceKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKeyConfigured) {
    try {
      const db = createServiceClient();

      const { data: branchData } = await db
        .from("branches")
        .select("id, name, organization_id")
        .eq("slug", parsed.data.branchSlug)
        .eq("is_active", true)
        .maybeSingle();
      const branch = branchData as {
        id: string;
        name: string;
        organization_id: string;
      } | null;

      if (!branch) {
        return Response.json(
          {
            status: "error",
            message: "Branch not found or inactive.",
          },
          { status: 404 },
        );
      }

      const submissionId = await insertFeedbackSubmission(db, {
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
    } catch {
      // Persistence failure is non-blocking — we still return 202
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

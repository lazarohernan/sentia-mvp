import { insertAiAnalysis, insertFeedbackSubmission } from "@/domain/feedback/repository";
import { analyzeFeedbackSentiment } from "@/domain/feedback/sentiment-analysis";
import { feedbackSubmissionSchema } from "@/domain/feedback/schemas";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
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

      const { data: branch } = await db
        .from("branches")
        .select("id")
        .eq("slug", parsed.data.branchSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (branch) {
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

        await insertAiAnalysis(db, submissionId, {
          status: sentimentAnalysis.status,
          model: sentimentAnalysis.model,
          analysis: sentimentAnalysis.status === "completed" ? sentimentAnalysis.analysis : undefined,
          confidence: sentimentAnalysis.status === "completed" ? sentimentAnalysis.confidence : undefined,
        });
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

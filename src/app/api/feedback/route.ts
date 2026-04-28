import { analyzeFeedbackSentiment } from "@/domain/feedback/sentiment-analysis";
import { feedbackSubmissionSchema } from "@/domain/feedback/schemas";

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

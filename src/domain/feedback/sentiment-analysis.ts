import type { AiAnalysis, FeedbackSubmission } from "./schemas";

const defaultModel = "pysentimiento/robertuito-sentiment-analysis";

type HuggingFaceClassification = {
  label: string;
  score: number;
};

export type SentimentAnalysisResult =
  | {
      status: "completed";
      model: string;
      analysis: AiAnalysis;
      rawLabel: string;
      confidence: number;
    }
  | {
      status: "disabled";
      model: string;
      reason: string;
    }
  | {
      status: "unavailable";
      model: string;
      reason: string;
    };

function getHuggingFaceModel() {
  return process.env.HUGGINGFACE_SENTIMENT_MODEL || defaultModel;
}

function getHuggingFaceToken() {
  return process.env.HUGGINGFACE_API_TOKEN?.trim();
}

function normalizeHuggingFaceOutput(
  output: unknown,
): HuggingFaceClassification[] {
  if (!Array.isArray(output)) {
    return [];
  }

  const firstItem = output[0];
  const rows = Array.isArray(firstItem) ? firstItem : output;

  return rows
    .filter(
      (item): item is HuggingFaceClassification =>
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "score" in item &&
        typeof item.label === "string" &&
        typeof item.score === "number",
    )
    .sort((a, b) => b.score - a.score);
}

function mapLabelToAnalysis(
  label: string,
  confidence: number,
  submission: FeedbackSubmission,
): AiAnalysis {
  const normalizedLabel = label.toUpperCase();
  const sentiment =
    normalizedLabel === "NEG" || normalizedLabel.includes("NEGATIVE")
      ? "negative"
      : normalizedLabel === "POS" || normalizedLabel.includes("POSITIVE")
        ? "positive"
        : "neutral";
  const polarity =
    sentiment === "negative"
      ? -confidence
      : sentiment === "positive"
        ? confidence
        : 0;
  const lowSatisfaction =
    submission.csatScore !== undefined
      ? submission.csatScore <= 2
      : submission.emotionScore <= 2;
  const urgency =
    sentiment === "negative" && lowSatisfaction
      ? "high"
      : sentiment === "negative"
        ? "medium"
        : "low";
  const category =
    submission.type === "complaint" ? "customer_service" : "other";

  return {
    sentiment,
    polarity: Number(polarity.toFixed(3)),
    emotionScore: submission.emotionScore,
    urgency,
    category,
    entities: [],
    summary:
      sentiment === "negative"
        ? "Comentario con señal negativa que conviene revisar."
        : sentiment === "positive"
          ? "Comentario con señal positiva para identificar buenas prácticas."
          : "Comentario neutral que puede aportar contexto operativo.",
    recommendedAction:
      urgency === "high"
        ? "Revisar el caso con gerencia de turno y definir seguimiento."
        : "Registrar la señal y observar si se repite en la sucursal.",
    keywords: [],
  };
}

export async function analyzeFeedbackSentiment(
  submission: FeedbackSubmission,
): Promise<SentimentAnalysisResult> {
  const model = getHuggingFaceModel();
  const token = getHuggingFaceToken();

  if (!token) {
    return {
      status: "disabled",
      model,
      reason: "HUGGINGFACE_API_TOKEN is not configured.",
    };
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: submission.freeText,
          options: {
            wait_for_model: true,
          },
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      return {
        status: "unavailable",
        model,
        reason: `Hugging Face responded with ${response.status}.`,
      };
    }

    const output: unknown = await response.json();
    const classifications = normalizeHuggingFaceOutput(output);
    const bestMatch = classifications[0];

    if (!bestMatch) {
      return {
        status: "unavailable",
        model,
        reason: "Hugging Face returned an unexpected response.",
      };
    }

    return {
      status: "completed",
      model,
      analysis: mapLabelToAnalysis(
        bestMatch.label,
        bestMatch.score,
        submission,
      ),
      rawLabel: bestMatch.label,
      confidence: Number(bestMatch.score.toFixed(4)),
    };
  } catch (error) {
    return {
      status: "unavailable",
      model,
      reason: error instanceof Error ? error.message : "Unknown analysis error.",
    };
  }
}

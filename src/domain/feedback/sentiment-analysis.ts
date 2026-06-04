import type { AiAnalysis, FeedbackSubmission, FeedbackType } from "./schemas";

/** Modelo desplegado en HF Inference (serverless). robertuito no está disponible en ese proveedor. */
export const defaultHuggingFaceSentimentModel =
  "finiteautomata/beto-sentiment-analysis";

const inferenceBaseUrl = "https://router.huggingface.co/hf-inference/models";

/** Límite conservador para modelos BERT/BETO (evita timeouts y truncado silencioso). */
const maxInputCharacters = 512;

const maxRetries = 2;
const requestTimeoutMs = 15_000;

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

const categoryLabels: Record<
  AiAnalysis["category"],
  string
> = {
  customer_service: "Atención al cliente",
  wait_time: "Tiempo de espera",
  product_quality: "Calidad del producto",
  cleanliness: "Limpieza",
  price: "Precio",
  environment: "Ambiente",
  billing: "Facturación",
  other: "Experiencia general",
};

export function getHuggingFaceModel() {
  return process.env.HUGGINGFACE_SENTIMENT_MODEL?.trim() || defaultHuggingFaceSentimentModel;
}

export function getHuggingFaceToken() {
  return process.env.HUGGINGFACE_API_TOKEN?.trim();
}

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return "Experiencia del cliente";
  }

  return categoryLabels[category as AiAnalysis["category"]] ?? "Experiencia del cliente";
}

export function prepareTextForHuggingFace(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxInputCharacters) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxInputCharacters);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxInputCharacters * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }

  return `${slice.trim()}…`;
}

export function normalizeHuggingFaceOutput(
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

function mapFeedbackTypeToCategory(type: FeedbackType): AiAnalysis["category"] {
  switch (type) {
    case "complaint":
      return "customer_service";
    case "suggestion":
      return "other";
    case "compliment":
      return "environment";
    case "recommendation":
      return "product_quality";
    default:
      return "other";
  }
}

function mapLabelToSentiment(label: string): AiAnalysis["sentiment"] {
  const normalizedLabel = label.toUpperCase();

  if (
    normalizedLabel === "NEG" ||
    normalizedLabel.includes("NEGATIVE") ||
    normalizedLabel.includes("NEGATIVO")
  ) {
    return "negative";
  }

  if (
    normalizedLabel === "POS" ||
    normalizedLabel.includes("POSITIVE") ||
    normalizedLabel.includes("POSITIVO")
  ) {
    return "positive";
  }

  return "neutral";
}

function deriveUrgency(params: {
  sentiment: AiAnalysis["sentiment"];
  confidence: number;
  submission: FeedbackSubmission;
}): AiAnalysis["urgency"] {
  const lowSatisfaction =
    params.submission.csatScore !== undefined
      ? params.submission.csatScore <= 2
      : params.submission.emotionScore <= 2;

  if (params.sentiment === "negative" && lowSatisfaction) {
    if (
      params.submission.type === "complaint" ||
      params.confidence >= 0.92
    ) {
      return "critical";
    }

    return "high";
  }

  if (params.sentiment === "negative") {
    return "medium";
  }

  return "low";
}

export function mapLabelToAnalysis(
  label: string,
  confidence: number,
  submission: FeedbackSubmission,
): AiAnalysis {
  const sentiment = mapLabelToSentiment(label);
  const polarity =
    sentiment === "negative"
      ? -confidence
      : sentiment === "positive"
        ? confidence
        : 0;
  const urgency = deriveUrgency({ sentiment, confidence, submission });
  const category = mapFeedbackTypeToCategory(submission.type);

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
      urgency === "critical" || urgency === "high"
        ? "Revisar el caso con gerencia de turno y definir seguimiento."
        : "Registrar la señal y observar si se repite en la sucursal.",
    keywords: [],
  };
}

async function parseHuggingFaceError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    const message = body.error ?? body.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Hugging Face respondió con ${response.status}.`;
}

function shouldRetryStatus(status: number): boolean {
  return status === 503 || status === 504 || status === 429;
}

async function callHuggingFaceInference(
  model: string,
  token: string,
  text: string,
): Promise<Response> {
  const url = `${inferenceBaseUrl}/${model}`;

  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          function_to_apply: "softmax",
        },
        options: {
          wait_for_model: true,
          use_cache: true,
        },
      }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    lastResponse = response;

    if (response.ok || !shouldRetryStatus(response.status)) {
      return response;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }

  return lastResponse!;
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

  const inputText = prepareTextForHuggingFace(submission.freeText);

  if (inputText.length < 8) {
    return {
      status: "unavailable",
      model,
      reason: "El texto del comentario es demasiado corto para analizar.",
    };
  }

  try {
    const response = await callHuggingFaceInference(model, token, inputText);

    if (!response.ok) {
      return {
        status: "unavailable",
        model,
        reason: await parseHuggingFaceError(response),
      };
    }

    const output: unknown = await response.json();
    const classifications = normalizeHuggingFaceOutput(output);
    const bestMatch = classifications[0];

    if (!bestMatch) {
      return {
        status: "unavailable",
        model,
        reason: "Hugging Face devolvió un formato de respuesta inesperado.",
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

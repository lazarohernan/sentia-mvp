import { z } from "zod";

import type { AiAnalysis, FeedbackSubmission, FeedbackType } from "./schemas";
import {
  aiAnalysisSchema,
  feedbackCategorySchema,
  informationQualitySchema,
  sentimentSchema,
  urgencySchema,
} from "./schemas";
import {
  assessInformationQuality,
  buildAnalysisText,
  enrichAnalysisWithInformationQuality,
  getClarificationAnswer,
} from "./adaptive-follow-up";

/** Modelo desplegado en HF Inference (serverless). robertuito no está disponible en ese proveedor. */
export const defaultHuggingFaceSentimentModel =
  "finiteautomata/beto-sentiment-analysis";

const inferenceBaseUrl = "https://router.huggingface.co/hf-inference/models";
const openAiResponsesUrl = "https://api.openai.com/v1/responses";

/** Límite conservador para modelos BERT/BETO (evita timeouts y truncado silencioso). */
const maxInputCharacters = 512;

const maxRetries = 2;
const requestTimeoutMs = 15_000;
const defaultOpenAIAlertsModel = "gpt-4.1-mini";

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

export function getOpenAIKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

export function getOpenAIAlertsModel() {
  return (
    process.env.OPENAI_ALERTS_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    defaultOpenAIAlertsModel
  );
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

const categoryKeywordRules: Array<{
  category: AiAnalysis["category"];
  keyword: string;
  patterns: RegExp[];
}> = [
  {
    category: "wait_time",
    keyword: "espera",
    patterns: [/\besper/, /\bfila\b/, /\btard/, /\bdemor/, /\bminuto/],
  },
  {
    category: "billing",
    keyword: "facturación",
    patterns: [/\bfactur/, /\bcobro\b/, /\bpago\b/, /\brecibo\b/],
  },
  {
    category: "cleanliness",
    keyword: "limpieza",
    patterns: [/\bsuci/, /\blimp/, /\bba[ñn]o/, /\bmesa/],
  },
  {
    category: "price",
    keyword: "precio",
    patterns: [/\bprecio/, /\bcar[oa]\b/, /\bcost/, /\bbarat/],
  },
  {
    category: "product_quality",
    keyword: "producto",
    patterns: [/\bproducto/, /\bcomida/, /\bbebida/, /\bfr[ií]o/, /\bcalidad/],
  },
  {
    category: "environment",
    keyword: "ambiente",
    patterns: [/\bambiente/, /\bruido/, /\bm[uú]sica/, /\bclima/, /\blugar/],
  },
  {
    category: "customer_service",
    keyword: "atención",
    patterns: [/\batenci[oó]n/, /\bservicio/, /\bamable/, /\btrato/, /\bpersonal/],
  },
];

function normalizeForKeywordMatch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function deriveOperationalSignals(
  submission: FeedbackSubmission,
): Pick<AiAnalysis, "category" | "keywords"> {
  const normalizedText = normalizeForKeywordMatch(buildAnalysisText(submission));
  const matchedRule = categoryKeywordRules.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(normalizedText)),
  );

  if (matchedRule) {
    return {
      category: matchedRule.category,
      keywords: [matchedRule.keyword],
    };
  }

  const category = mapFeedbackTypeToCategory(submission.type);
  return {
    category,
    keywords: category === "other" ? [] : [getCategoryLabel(category).toLowerCase()],
  };
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

const openAiTriageSchema = aiAnalysisSchema
  .pick({
    sentiment: true,
    urgency: true,
    category: true,
    summary: true,
    recommendedAction: true,
    informationQuality: true,
    followUpQuestion: true,
    keywords: true,
    entities: true,
  })
  .extend({
    confidence: aiAnalysisSchema.shape.polarity.min(0).max(1),
    followUpQuestion: z.string().nullable().optional(),
  });

function buildOpenAIResponseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "sentiment",
      "urgency",
      "category",
      "summary",
      "recommendedAction",
      "informationQuality",
      "followUpQuestion",
      "keywords",
      "entities",
      "confidence",
    ],
    properties: {
      sentiment: {
        type: "string",
        enum: sentimentSchema.options,
      },
      urgency: {
        type: "string",
        enum: urgencySchema.options,
      },
      category: {
        type: "string",
        enum: feedbackCategorySchema.options,
      },
      summary: {
        type: "string",
        description:
          "Parrafo natural en español con problema, causa probable y contexto. No usar bullets ni JSON visible.",
      },
      recommendedAction: {
        type: "string",
        description:
          "Siguiente accion concreta en español, escrita en lenguaje natural.",
      },
      informationQuality: {
        type: "string",
        enum: informationQualitySchema.options,
        description:
          "sufficient si el texto explica motivo claro; partial si hay señal pero falta detalle; insufficient si no permite actuar.",
      },
      followUpQuestion: {
        type: ["string", "null"],
        description:
          "Una sola pregunta breve para pedir contexto si la informacion es partial o insufficient. Null si no hace falta.",
      },
      keywords: {
        type: "array",
        items: { type: "string" },
      },
      entities: {
        type: "array",
        items: { type: "string" },
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
  };
}

function buildOpenAITriagePrompt(submission: FeedbackSubmission): string {
  const initialAssessment = assessInformationQuality(submission);
  const clarification = getClarificationAnswer(submission);

  return [
    "Analiza esta valoracion de cliente para una plataforma operativa multi-sucursal.",
    "Devuelve JSON estricto con la clasificacion interna.",
    "El resumen visible debe ser un parrafo natural, breve y comprensible; no uses checklist, markdown, bullets ni tono robotico.",
    "La accion recomendada debe ser concreta y ejecutable por un gerente de sucursal.",
    "Tambien evalua si el comentario sirve para un informe semanal o mensual. En Honduras y Latinoamerica muchas respuestas son coloquiales; no castigues el tono, solo la falta de causa concreta.",
    "Si falta contexto, propone una sola pregunta corta y amable para pedir motivo principal. No hagas interrogatorio.",
    "",
    `Sucursal: ${submission.branchSlug}`,
    `Tipo: ${submission.type}`,
    `CSAT: ${submission.csatScore ?? "no informado"}`,
    `NPS: ${submission.npsScore ?? "no informado"}`,
    `Emocion: ${submission.emotionScore}/5`,
    `Calidad heuristica inicial: ${initialAssessment.quality}`,
    `Motivo heuristico: ${initialAssessment.reason}`,
    `Comentario: ${submission.freeText}`,
    clarification ? `Precision adicional: ${clarification}` : "Precision adicional: no enviada",
  ].join("\n");
}

function extractOpenAIOutputText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = "output" in payload ? payload.output : null;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (typeof item !== "object" || item === null || !("content" in item)) {
      continue;
    }

    const content = item.content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
    }
  }

  return null;
}

function mapOpenAITriageToAnalysis(
  triage: unknown,
  submission: FeedbackSubmission,
): { analysis: AiAnalysis; confidence: number } | null {
  const parsed = openAiTriageSchema.safeParse(triage);
  if (!parsed.success) {
    return null;
  }

  const confidence = Number(parsed.data.confidence.toFixed(4));
  const polarity =
    parsed.data.sentiment === "negative"
      ? -confidence
      : parsed.data.sentiment === "positive"
        ? confidence
        : 0;
  const summary = normalizeVisibleAiLanguage(parsed.data.summary);
  const recommendedAction = normalizeVisibleAiLanguage(parsed.data.recommendedAction);
  const followUpQuestion = parsed.data.followUpQuestion
    ? normalizeVisibleAiLanguage(parsed.data.followUpQuestion)
    : undefined;
  const analysis = aiAnalysisSchema.parse({
    sentiment: parsed.data.sentiment,
    polarity: Number(polarity.toFixed(3)),
    emotionScore: submission.emotionScore,
    urgency: parsed.data.urgency,
    category: parsed.data.category,
    summary,
    recommendedAction,
    informationQuality: parsed.data.informationQuality,
    followUpQuestion,
    followUpAnswer: getClarificationAnswer(submission) ?? undefined,
    keywords: parsed.data.keywords,
    entities: parsed.data.entities,
  });

  return { analysis, confidence };
}

function normalizeVisibleAiLanguage(text: string): string {
  return text
    .split(/\r?\n+/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+[.)]\s+/, ""),
    )
    .filter(Boolean)
    .join(" ")
    .replace(/\s[-*•]\s+/g, " ")
    .replace(/\s\d+[.)]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function analyzeFeedbackWithOpenAI(
  submission: FeedbackSubmission,
  apiKey: string,
): Promise<SentimentAnalysisResult> {
  const model = getOpenAIAlertsModel();

  try {
    const response = await fetch(openAiResponsesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Eres un analista operativo de experiencia de cliente. Clasificas feedback para alertas y escribes lenguaje natural claro para gerentes.",
          },
          {
            role: "user",
            content: buildOpenAITriagePrompt(submission),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "sayit_alert_triage",
            strict: true,
            schema: buildOpenAIResponseSchema(),
          },
        },
      }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok) {
      return {
        status: "unavailable",
        model,
        reason: `OpenAI respondió con ${response.status}.`,
      };
    }

    const body: unknown = await response.json();
    const outputText = extractOpenAIOutputText(body);
    if (!outputText) {
      return {
        status: "unavailable",
        model,
        reason: "OpenAI devolvió una respuesta sin texto estructurado.",
      };
    }

    const triage = JSON.parse(outputText) as unknown;
    const mapped = mapOpenAITriageToAnalysis(triage, submission);
    if (!mapped) {
      return {
        status: "unavailable",
        model,
        reason: "OpenAI devolvió un triage que no cumple el schema local.",
      };
    }

    return {
      status: "completed",
      model,
      analysis: mapped.analysis,
      rawLabel: "openai_triage",
      confidence: mapped.confidence,
    };
  } catch (error) {
    return {
      status: "unavailable",
      model,
      reason: error instanceof Error ? error.message : "Unknown OpenAI analysis error.",
    };
  }
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
  const { category, keywords } = deriveOperationalSignals(submission);
  const categoryLabel = getCategoryLabel(category);

  return enrichAnalysisWithInformationQuality({
    sentiment,
    polarity: Number(polarity.toFixed(3)),
    emotionScore: submission.emotionScore,
    urgency,
    category,
    entities: [],
    summary:
      sentiment === "negative"
        ? `${categoryLabel}: comentario con señal negativa que conviene revisar.`
        : sentiment === "positive"
          ? `${categoryLabel}: comentario con señal positiva para identificar buenas prácticas.`
          : `${categoryLabel}: comentario neutral que puede aportar contexto operativo.`,
    recommendedAction:
      urgency === "critical" || urgency === "high"
        ? "Revisar el caso con gerencia de turno y definir seguimiento."
        : "Registrar la señal y observar si se repite en la sucursal.",
    keywords,
  }, submission);
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
  const openAiKey = getOpenAIKey();
  if (openAiKey) {
    const openAiResult = await analyzeFeedbackWithOpenAI(submission, openAiKey);
    if (openAiResult.status === "completed" || !getHuggingFaceToken()) {
      return openAiResult;
    }
  }

  const model = getHuggingFaceModel();
  const token = getHuggingFaceToken();

  if (!token) {
    return {
      status: "disabled",
      model,
      reason: "HUGGINGFACE_API_TOKEN is not configured.",
    };
  }

  const inputText = prepareTextForHuggingFace(buildAnalysisText(submission));

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

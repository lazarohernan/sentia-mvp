import type { AiAnalysis, FeedbackSubmission } from "./schemas";

export type InformationQuality = "sufficient" | "partial" | "insufficient";

type FollowUpDecision = {
  shouldAsk: boolean;
  quality: InformationQuality;
  reason: string;
  question: string | null;
};

const genericSignals = [
  "algo",
  "cosas",
  "varias cosas",
  "varias areas",
  "varias áreas",
  "mucho que mejorar",
  "pueden mejorar",
  "podrian mejorar",
  "podrían mejorar",
  "mejorar",
  "regular",
  "normal",
  "mas o menos",
  "más o menos",
  "todo bien",
  "bien pero",
  "excelente pero",
];

const specificSignals = [
  "atencion",
  "atención",
  "servicio",
  "personal",
  "mesero",
  "cajero",
  "fila",
  "espera",
  "tarde",
  "demoro",
  "demoró",
  "minutos",
  "comida",
  "producto",
  "bebida",
  "frio",
  "frío",
  "caliente",
  "limpieza",
  "sucio",
  "baño",
  "bano",
  "mesa",
  "precio",
  "caro",
  "cobro",
  "pago",
  "factura",
  "ambiente",
  "musica",
  "música",
  "ruido",
  "parqueo",
];

const questionByScore: Record<string, string> = {
  low: "¿Qué fue lo principal que debemos corregir?",
  neutral: "¿Qué fue lo principal que podría mejorar?",
  high: "¿Qué fue lo que más influyó en tu experiencia?",
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getClarificationAnswer(submission: FeedbackSubmission): string | null {
  const clarification = submission.clarification;
  if (!clarification) {
    return null;
  }

  const parts = [
    clarification.category
      ? `Motivo principal: ${clarification.category}`
      : null,
    clarification.detail ? `Detalle: ${clarification.detail}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(". ") : null;
}

export function buildAnalysisText(submission: FeedbackSubmission): string {
  const clarification = getClarificationAnswer(submission);
  return clarification
    ? `${submission.freeText}\n\nPrecision adicional del cliente: ${clarification}`
    : submission.freeText;
}

export function assessInformationQuality(
  submission: Pick<FeedbackSubmission, "freeText" | "csatScore" | "emotionScore" | "clarification">,
): FollowUpDecision {
  const normalizedText = normalizeText(submission.freeText);
  const words = countWords(submission.freeText);
  const hasGenericSignal = genericSignals.some((signal) =>
    normalizedText.includes(normalizeText(signal)),
  );
  const hasSpecificSignal = specificSignals.some((signal) =>
    normalizedText.includes(normalizeText(signal)),
  );
  const hasClarification =
    Boolean(submission.clarification?.category) ||
    Boolean(submission.clarification?.detail);

  if (hasClarification) {
    return {
      shouldAsk: false,
      quality: "sufficient",
      reason: "El cliente ya agregó un motivo o detalle adicional.",
      question: null,
    };
  }

  const score = submission.csatScore ?? submission.emotionScore;
  const scoreBand = score <= 2 ? "low" : score >= 4 ? "high" : "neutral";
  const question = questionByScore[scoreBand];

  if (words < 8) {
    return {
      shouldAsk: true,
      quality: "insufficient",
      reason: "El comentario es muy corto para explicar la causa.",
      question,
    };
  }

  if (!hasSpecificSignal && (hasGenericSignal || words < 16)) {
    return {
      shouldAsk: true,
      quality: "partial",
      reason: "El comentario expresa una opinión, pero no deja claro el motivo.",
      question,
    };
  }

  if (hasGenericSignal && !hasSpecificSignal) {
    return {
      shouldAsk: true,
      quality: "partial",
      reason: "Hay una señal ambigua que necesita categoría para ser accionable.",
      question,
    };
  }

  return {
    shouldAsk: false,
    quality: words >= 16 ? "sufficient" : "partial",
    reason:
      words >= 16
        ? "El comentario contiene suficiente contexto operativo."
        : "El comentario tiene una señal útil, aunque breve.",
    question: null,
  };
}

export function enrichAnalysisWithInformationQuality(
  analysis: Omit<
    AiAnalysis,
    "informationQuality" | "followUpQuestion" | "followUpAnswer"
  > &
    Partial<
      Pick<AiAnalysis, "informationQuality" | "followUpQuestion" | "followUpAnswer">
    >,
  submission: FeedbackSubmission,
): AiAnalysis {
  const assessment = assessInformationQuality(submission);

  return {
    ...analysis,
    informationQuality: analysis.informationQuality ?? assessment.quality,
    followUpQuestion:
      analysis.followUpQuestion ??
      (assessment.shouldAsk ? assessment.question ?? undefined : undefined),
    followUpAnswer: analysis.followUpAnswer ?? getClarificationAnswer(submission) ?? undefined,
  };
}

export type AiUseCase =
  | "feedback_triage"
  | "operational_report"
  | "improvement_narrative"
  | "executive_summary"
  | "manual_estimate"
  | "listening_coaching_prep";

export type AiTokenUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
};

export type AiModelPricing = {
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion: number;
  outputUsdPerMillion: number;
  source: string;
  effectiveDate: string;
};

export type AiUsageCostEstimate = {
  usage: AiTokenUsage;
  pricing: AiModelPricing | null;
  estimatedCostUsd: number | null;
};

const openAiPricingSource =
  "https://developers.openai.com/api/docs/pricing#flagship-models";
const pricingEffectiveDate = "2026-07-03";

const openAiStandardShortContextPricing: Record<string, AiModelPricing> = {
  "gpt-5.5": {
    inputUsdPerMillion: 5,
    cachedInputUsdPerMillion: 0.5,
    outputUsdPerMillion: 30,
    source: openAiPricingSource,
    effectiveDate: pricingEffectiveDate,
  },
  "gpt-5.4": {
    inputUsdPerMillion: 2.5,
    cachedInputUsdPerMillion: 0.25,
    outputUsdPerMillion: 15,
    source: openAiPricingSource,
    effectiveDate: pricingEffectiveDate,
  },
  "gpt-5.4-mini": {
    inputUsdPerMillion: 0.75,
    cachedInputUsdPerMillion: 0.075,
    outputUsdPerMillion: 4.5,
    source: openAiPricingSource,
    effectiveDate: pricingEffectiveDate,
  },
  "gpt-5.4-nano": {
    inputUsdPerMillion: 0.2,
    cachedInputUsdPerMillion: 0.02,
    outputUsdPerMillion: 1.25,
    source: openAiPricingSource,
    effectiveDate: pricingEffectiveDate,
  },
};

function toSafeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : 0;
}

function getNumberFromRecord(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return 0;
  }

  return toSafeInteger((value as Record<string, unknown>)[key]);
}

export function normalizeOpenAIUsage(rawUsage: unknown): AiTokenUsage | null {
  if (!rawUsage || typeof rawUsage !== "object") {
    return null;
  }

  const record = rawUsage as Record<string, unknown>;
  const inputTokens = toSafeInteger(record.input_tokens ?? record.inputTokens);
  const outputTokens = toSafeInteger(record.output_tokens ?? record.outputTokens);
  const totalTokens = toSafeInteger(record.total_tokens ?? record.totalTokens);
  const inputDetails = record.input_tokens_details ?? record.inputTokensDetails;
  const outputDetails = record.output_tokens_details ?? record.outputTokensDetails;

  const cachedInputTokens =
    getNumberFromRecord(inputDetails, "cached_tokens") ||
    getNumberFromRecord(inputDetails, "cachedTokens");
  const reasoningOutputTokens =
    getNumberFromRecord(outputDetails, "reasoning_tokens") ||
    getNumberFromRecord(outputDetails, "reasoningTokens");

  if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
    return null;
  }

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens: totalTokens || inputTokens + outputTokens,
  };
}

export function getOpenAIModelPricing(model: string): AiModelPricing | null {
  return openAiStandardShortContextPricing[model] ?? null;
}

export function estimateOpenAICost(params: {
  model: string;
  usage: AiTokenUsage;
}): AiUsageCostEstimate {
  const pricing = getOpenAIModelPricing(params.model);

  if (!pricing) {
    return {
      usage: params.usage,
      pricing: null,
      estimatedCostUsd: null,
    };
  }

  const billableInputTokens = Math.max(
    params.usage.inputTokens - params.usage.cachedInputTokens,
    0,
  );
  const cost =
    (billableInputTokens / 1_000_000) * pricing.inputUsdPerMillion +
    (params.usage.cachedInputTokens / 1_000_000) *
      pricing.cachedInputUsdPerMillion +
    (params.usage.outputTokens / 1_000_000) * pricing.outputUsdPerMillion;

  return {
    usage: params.usage,
    pricing,
    estimatedCostUsd: Number(cost.toFixed(8)),
  };
}

export function estimateOpenAICostFromRawUsage(params: {
  model: string;
  rawUsage: unknown;
}): AiUsageCostEstimate | null {
  const usage = normalizeOpenAIUsage(params.rawUsage);
  if (!usage) {
    return null;
  }

  return estimateOpenAICost({ model: params.model, usage });
}

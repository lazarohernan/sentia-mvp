import { describe, expect, it } from "vitest";

import {
  estimateOpenAICost,
  estimateOpenAICostFromRawUsage,
  getOpenAIModelPricing,
  normalizeOpenAIUsage,
} from "./pricing";

describe("AI usage pricing", () => {
  it("normalizes Responses API usage", () => {
    expect(
      normalizeOpenAIUsage({
        input_tokens: 1000,
        input_tokens_details: { cached_tokens: 250 },
        output_tokens: 300,
        output_tokens_details: { reasoning_tokens: 50 },
        total_tokens: 1300,
      }),
    ).toEqual({
      inputTokens: 1000,
      cachedInputTokens: 250,
      outputTokens: 300,
      reasoningOutputTokens: 50,
      totalTokens: 1300,
    });
  });

  it("calculates cost with cached input discount", () => {
    const estimate = estimateOpenAICost({
      model: "gpt-5.4-mini",
      usage: {
        inputTokens: 1000,
        cachedInputTokens: 200,
        outputTokens: 500,
        reasoningOutputTokens: 0,
        totalTokens: 1500,
      },
    });

    expect(estimate.pricing).toEqual(getOpenAIModelPricing("gpt-5.4-mini"));
    expect(estimate.estimatedCostUsd).toBe(0.002865);
  });

  it("keeps usage measurable when a model has no current pricing entry", () => {
    const estimate = estimateOpenAICostFromRawUsage({
      model: "unknown-model",
      rawUsage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
      },
    });

    expect(estimate?.pricing).toBeNull();
    expect(estimate?.estimatedCostUsd).toBeNull();
    expect(estimate?.usage.totalTokens).toBe(150);
  });
});

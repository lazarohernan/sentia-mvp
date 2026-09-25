import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedbackSubmission } from "./schemas";
import {
  analyzeFeedbackSentiment,
  getCategoryLabel,
} from "./sentiment-analysis";

const baseSubmission: FeedbackSubmission = {
  branchSlug: "mall-norte",
  branchId: "11111111-1111-4111-8111-111111111111",
  branchToken: "signed-branch-token-value",
  type: "complaint",
  emotionScore: 2,
  csatScore: 2,
  freeText: "El servicio fue lento y nadie me atendió bien en caja.",
  consentAccepted: true,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analyzeFeedbackSentiment", () => {
  it("uses OpenAI alert triage with structured output and natural visible language when configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-5.4-mini");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          usage: {
            input_tokens: 1000,
            input_tokens_details: { cached_tokens: 100 },
            output_tokens: 200,
            output_tokens_details: { reasoning_tokens: 25 },
            total_tokens: 1200,
          },
          output_text: JSON.stringify({
            sentiment: "negative",
            urgency: "critical",
            category: "wait_time",
            summary:
              "En Mall Norte se esta repitiendo un problema de espera durante horas pico. La causa mas probable es falta de apoyo en caja.",
            probableCause: "Falta de apoyo en caja durante la hora pico.",
            recommendedAction:
              "Conviene reforzar caja entre 5pm y 8pm y revisar si los comentarios por espera bajan en los proximos 14 dias.",
            suggestedOwner: "Gerencia de turno",
            suggestedSla: "Hoy mismo",
            requiresContact: true,
            informationQuality: "sufficient",
            followUpQuestion: null,
            keywords: ["espera", "fila"],
            entities: ["Mall Norte"],
            confidence: 0.86,
          }),
        }),
      ),
    );

    const result = await analyzeFeedbackSentiment({
      ...baseSubmission,
      branchSlug: "mall-norte",
      freeText: "Espere 40 minutos y la fila no avanzaba.",
    });

    expect(result.status).toBe("completed");

    if (result.status !== "completed") {
      throw new Error("Expected completed OpenAI triage.");
    }

    expect(result.model).toBe("gpt-5.4-mini");
    expect(result.rawLabel).toBe("openai_triage");
    expect(result.confidence).toBe(0.86);
    expect(result.usageEstimate?.usage).toMatchObject({
      inputTokens: 1000,
      cachedInputTokens: 100,
      outputTokens: 200,
      reasoningOutputTokens: 25,
      totalTokens: 1200,
    });
    expect(result.usageEstimate?.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.analysis).toMatchObject({
      sentiment: "negative",
      urgency: "critical",
      category: "wait_time",
      informationQuality: "sufficient",
      keywords: ["espera", "fila"],
      entities: ["Mall Norte"],
    });
    expect(result.analysis.summary).toContain("problema de espera");
    expect(result.analysis.summary).not.toContain("- ");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openai-key",
        }),
      }),
    );
  });

  it("normalizes accidental checklist formatting from OpenAI before storing visible language", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          output_text: JSON.stringify({
            sentiment: "negative",
            urgency: "high",
            category: "cleanliness",
            summary:
              "- Problema: los clientes mencionan mesas sucias.\n- Causa probable: limpieza insuficiente entre turnos.",
            probableCause:
              "- Causa probable: limpieza insuficiente entre turnos.",
            recommendedAction:
              "1. Revisar el cierre de mesas.\n2. Asignar una persona responsable durante hora pico.",
            suggestedOwner: "Operaciones",
            suggestedSla: "Dentro de 24 horas",
            requiresContact: false,
            informationQuality: "partial",
            followUpQuestion: "¿Qué parte de la limpieza fue el problema principal?",
            keywords: ["limpieza"],
            entities: [],
            confidence: 0.79,
          }),
        }),
      ),
    );

    const result = await analyzeFeedbackSentiment({
      ...baseSubmission,
      freeText: "Las mesas estaban sucias y nadie limpio antes de sentarnos.",
    });

    expect(result.status).toBe("completed");

    if (result.status !== "completed") {
      throw new Error("Expected completed OpenAI triage.");
    }

    expect(result.analysis.summary).not.toContain("\n");
    expect(result.analysis.summary).not.toContain("- ");
    expect(result.analysis.recommendedAction).not.toContain("1.");
    expect(result.analysis.followUpQuestion).not.toContain("¿ ");
  });
});

describe("getCategoryLabel", () => {
  it("returns Spanish labels for dashboard display", () => {
    expect(getCategoryLabel("customer_service")).toBe("Atención al cliente");
    expect(getCategoryLabel("unknown")).toBe("Experiencia del cliente");
  });
});

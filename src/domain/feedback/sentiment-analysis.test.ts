import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedbackSubmission } from "./schemas";
import {
  analyzeFeedbackSentiment,
  getCategoryLabel,
  mapLabelToAnalysis,
  normalizeHuggingFaceOutput,
  prepareTextForHuggingFace,
} from "./sentiment-analysis";

const baseSubmission: FeedbackSubmission = {
  branchSlug: "mall-norte",
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

describe("normalizeHuggingFaceOutput", () => {
  it("parses nested beto response format", () => {
    const rows = normalizeHuggingFaceOutput([
      [
        { label: "NEG", score: 0.91 },
        { label: "POS", score: 0.05 },
        { label: "NEU", score: 0.04 },
      ],
    ]);

    expect(rows[0]?.label).toBe("NEG");
    expect(rows[0]?.score).toBeCloseTo(0.91);
  });

  it("parses flat classification array from HF docs", () => {
    const rows = normalizeHuggingFaceOutput([
      { label: "POS", score: 0.8 },
      { label: "NEG", score: 0.1 },
    ]);

    expect(rows[0]?.label).toBe("POS");
  });
});

describe("mapLabelToAnalysis", () => {
  it("maps NEG with low CSAT to critical urgency for complaints", () => {
    const analysis = mapLabelToAnalysis("NEG", 0.95, baseSubmission);

    expect(analysis.sentiment).toBe("negative");
    expect(analysis.urgency).toBe("critical");
    expect(analysis.category).toBe("customer_service");
  });

  it("maps NEU to neutral sentiment", () => {
    const analysis = mapLabelToAnalysis("NEU", 0.7, {
      ...baseSubmission,
      type: "suggestion",
      csatScore: 3,
    });

    expect(analysis.sentiment).toBe("neutral");
    expect(analysis.urgency).toBe("low");
  });

  it("maps POS to positive sentiment", () => {
    const analysis = mapLabelToAnalysis("POS", 0.88, {
      ...baseSubmission,
      type: "compliment",
      csatScore: 5,
      emotionScore: 5,
    });

    expect(analysis.sentiment).toBe("positive");
    expect(analysis.urgency).toBe("low");
  });

  it("derives operational category and keywords from Spanish feedback text", () => {
    const analysis = mapLabelToAnalysis("NEG", 0.89, {
      ...baseSubmission,
      type: "complaint",
      csatScore: 2,
      freeText: "Espere 40 minutos en caja y la fila no avanzaba.",
    });

    expect(analysis.category).toBe("wait_time");
    expect(analysis.keywords).toContain("espera");
    expect(analysis.summary).toContain("Tiempo de espera");
  });

  it("uses clarification detail to derive the operational category for ambiguous comments", () => {
    const analysis = mapLabelToAnalysis("NEU", 0.72, {
      ...baseSubmission,
      type: "compliment",
      csatScore: 4,
      emotionScore: 4,
      freeText: "Me gusto pero no me gusto, estuvo bien pero le falto.",
      clarification: {
        question: undefined,
        category: "other",
        detail: "La espera fue larga y el lugar estaba sucio.",
      },
    });

    expect(analysis.category).toBe("wait_time");
    expect(analysis.keywords).toContain("espera");
    expect(analysis.informationQuality).toBe("sufficient");
  });
});

describe("analyzeFeedbackSentiment", () => {
  it("uses OpenAI alert triage with structured output and natural visible language when configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_ALERTS_MODEL", "gpt-4.1-mini");
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

    expect(result.model).toBe("gpt-4.1-mini");
    expect(result.rawLabel).toBe("openai_triage");
    expect(result.confidence).toBe(0.86);
    expect(result.usageEstimate?.usage).toMatchObject({
      inputTokens: 1000,
      cachedInputTokens: 100,
      outputTokens: 200,
      reasoningOutputTokens: 25,
      totalTokens: 1200,
    });
    expect(result.usageEstimate?.estimatedCostUsd).toBeNull();
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

describe("prepareTextForHuggingFace", () => {
  it("truncates very long comments before sending to the model", () => {
    const longText = `${"palabra ".repeat(200)}fin`;
    const prepared = prepareTextForHuggingFace(longText);

    expect(prepared.length).toBeLessThanOrEqual(513);
    expect(prepared.endsWith("…")).toBe(true);
  });
});

describe("getCategoryLabel", () => {
  it("returns Spanish labels for dashboard display", () => {
    expect(getCategoryLabel("customer_service")).toBe("Atención al cliente");
    expect(getCategoryLabel("unknown")).toBe("Experiencia del cliente");
  });
});

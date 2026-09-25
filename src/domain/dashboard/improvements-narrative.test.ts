import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateImprovementNarratives,
  humanizeNarrativeText,
  humanizePatternLabel,
} from "./improvements-narrative";
import type { DashboardCommentRow } from "./schemas";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("improvements-narrative labels", () => {
  it("traduce códigos internos a lenguaje humano", () => {
    expect(humanizePatternLabel("wait_time")).toBe("Tiempo de espera");
    expect(humanizePatternLabel("customer_service")).toBe("Atención al cliente");
    expect(humanizePatternLabel("Tiempo de espera")).toBe("Tiempo de espera");
  });

  it("limpia códigos técnicos que se cuelen en la narrativa", () => {
    expect(
      humanizeNarrativeText(
        "El patrón [[wait_time]] aparece en [[2 casos]] durante la tarde.",
      ),
    ).toBe("El patrón [[tiempo de espera]] aparece en [[2 casos]] durante la tarde.");
  });
});

describe("generateImprovementNarratives", () => {
  it("uses the single platform model and reports its usage", async () => {
    vi.stubEnv("OPENAI_MODEL", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          usage: {
            input_tokens: 800,
            output_tokens: 120,
            total_tokens: 920,
          },
          output_text: JSON.stringify({
            title: "Reducir espera en caja",
            narrative:
              "En [[Centro]] se registró [[1 caso de espera]]. Conviene revisar el flujo con [[gerencia de turno]].",
            urgency: "esta semana",
          }),
        }),
      ),
    );
    const onUsage = vi.fn();
    const comments: DashboardCommentRow[] = [
      {
        id: "comment-1",
        customer: "Cliente",
        business: "Cafetería",
        branch: "Centro",
        branchId: "11111111-1111-4111-8111-111111111111",
        feedbackType: "Queja",
        sentiment: "Riesgo",
        csatScore: 2,
        status: "Nuevo",
        message: "La fila de caja tardó demasiado durante la tarde.",
        receivedAt: "Hace una hora",
        dominantPattern: "wait_time",
      },
    ];

    const narratives = await generateImprovementNarratives(
      comments,
      "test-openai-key",
      { onUsage },
    );

    expect(narratives[0]).toMatchObject({
      title: "Reducir espera en caja",
      generatedByLlm: true,
    });
    expect(onUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: "11111111-1111-4111-8111-111111111111",
        model: "gpt-5.4-mini",
        estimate: expect.objectContaining({
          estimatedCostUsd: expect.any(Number),
        }),
      }),
    );
    const request = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      model: "gpt-5.4-mini",
    });
  });
});

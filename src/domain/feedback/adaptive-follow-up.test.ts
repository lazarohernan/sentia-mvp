import { describe, expect, it } from "vitest";

import {
  assessInformationQuality,
  buildAnalysisText,
  getClarificationAnswer,
} from "./adaptive-follow-up";

describe("adaptive feedback follow-up", () => {
  it("asks for one more detail when feedback is ambiguous", () => {
    const decision = assessInformationQuality({
      csatScore: 3,
      emotionScore: 3,
      freeText: "Estuvo excelente, pero hay mucho que mejorar.",
    });

    expect(decision.shouldAsk).toBe(true);
    expect(decision.quality).toBe("insufficient");
    expect(decision.question).toContain("mejorar");
  });

  it("does not ask again when the customer already clarified the main reason", () => {
    const decision = assessInformationQuality({
      csatScore: 3,
      emotionScore: 3,
      freeText: "Estuvo excelente, pero hay mucho que mejorar.",
      clarification: {
        category: "wait_time",
        detail: "La fila fue lenta al pagar.",
      },
    });

    expect(decision.shouldAsk).toBe(false);
    expect(decision.quality).toBe("sufficient");
  });

  it("adds clarification context to the text analyzed by AI", () => {
    const text = buildAnalysisText({
      branchSlug: "centro",
      type: "suggestion",
      csatScore: 3,
      emotionScore: 3,
      freeText: "Todo bien pero podria mejorar.",
      clarification: {
        category: "customer_service",
        detail: "La atención fue confusa en caja.",
      },
      consentAccepted: true,
    });

    expect(getClarificationAnswer({
      branchSlug: "centro",
      type: "suggestion",
      csatScore: 3,
      emotionScore: 3,
      freeText: "Todo bien pero podria mejorar.",
      clarification: {
        category: "customer_service",
        detail: "La atención fue confusa en caja.",
      },
      consentAccepted: true,
    })).toContain("customer_service");
    expect(text).toContain("Precision adicional");
    expect(text).toContain("La atención fue confusa");
  });
});

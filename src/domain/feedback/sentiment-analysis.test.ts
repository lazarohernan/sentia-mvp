import { describe, expect, it } from "vitest";

import type { FeedbackSubmission } from "./schemas";
import {
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

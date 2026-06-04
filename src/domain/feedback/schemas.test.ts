import { describe, expect, it } from "vitest";

import {
  aiAnalysisSchema,
  feedbackSubmissionSchema,
  listeningEventSchema,
} from "./schemas";

describe("feedbackSubmissionSchema", () => {
  it("accepts a simple public QR feedback submission", () => {
    const result = feedbackSubmissionSchema.parse({
      branchSlug: "  cafe-centro ",
      type: "complaint",
      npsScore: 4,
      csatScore: 2,
      emotionScore: 2,
      freeText: "  La comida   llego fria y nadie resolvio el problema.  ",
      clarification: {
        question: "  ¿Qué fue lo principal?  ",
        category: "product_quality",
        detail: "  La sopa llegó fría.  ",
      },
      contact: {
        name: " Ana   Lopez ",
        phone: "+50499999999",
      },
      consentAccepted: true,
    });

    expect(result.branchSlug).toBe("cafe-centro");
    expect(result.type).toBe("complaint");
    expect(result.freeText).toBe("La comida llego fria y nadie resolvio el problema.");
    expect(result.clarification?.category).toBe("product_quality");
    expect(result.clarification?.detail).toBe("La sopa llegó fría.");
    expect(result.contact?.name).toBe("Ana Lopez");
  });

  it("rejects empty comments and missing consent", () => {
    const result = feedbackSubmissionSchema.safeParse({
      branchSlug: "cafe-centro",
      type: "complaint",
      npsScore: 4,
      csatScore: 2,
      emotionScore: 2,
      freeText: "",
      consentAccepted: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("aiAnalysisSchema", () => {
  it("accepts structured AI analysis for dashboard metrics", () => {
    const result = aiAnalysisSchema.parse({
      sentiment: "negative",
      polarity: -0.8,
      emotionScore: 2,
      urgency: "high",
      category: "customer_service",
      entities: ["mesero", "sopa"],
      summary: "Cliente reporta mala atencion y comida fria.",
      recommendedAction: "Contactar al cliente y revisar el turno.",
      informationQuality: "sufficient",
      followUpQuestion: undefined,
      followUpAnswer: "Motivo principal: product_quality.",
      keywords: ["atencion", "comida fria"],
    });

    expect(result.urgency).toBe("high");
    expect(result.category).toBe("customer_service");
    expect(result.informationQuality).toBe("sufficient");
  });
});

describe("listeningEventSchema", () => {
  it("accepts only the four listening levels", () => {
    expect(
      listeningEventSchema.parse({
        collaboratorId: "collab_123",
        branchId: "branch_123",
        level: "empathetic_listening",
        note: "Logre entender la molestia del cliente.",
      }),
    ).toMatchObject({
      level: "empathetic_listening",
    });

    expect(() =>
      listeningEventSchema.parse({
        collaboratorId: "collab_123",
        branchId: "branch_123",
        level: "neutral",
      }),
    ).toThrow();
  });
});

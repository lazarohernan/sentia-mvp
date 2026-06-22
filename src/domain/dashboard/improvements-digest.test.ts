import { describe, expect, it } from "vitest";

import {
  buildBranchDigest,
  buildCommentFingerprint,
  formatBranchDigestForPrompt,
} from "./improvements-digest";
import type { DashboardCommentRow } from "./schemas";

function comment(partial: Partial<DashboardCommentRow>): DashboardCommentRow {
  return {
    id: partial.id ?? "comment-1",
    customer: "Cliente",
    business: "Negocio",
    branch: partial.branch ?? "Centro",
    feedbackType: partial.feedbackType ?? "Observación",
    sentiment: partial.sentiment ?? "Riesgo",
    csatScore: partial.csatScore ?? 2,
    status: partial.status ?? "Nuevo",
    message: partial.message ?? "Mensaje",
    receivedAt: partial.receivedAt ?? "hace 1 día",
    dominantPattern: partial.dominantPattern,
  };
}

describe("improvements-digest", () => {
  it("agrupa señales por área con riesgo y fortalezas", () => {
    const digest = buildBranchDigest([
      comment({
        id: "1",
        sentiment: "Riesgo",
        dominantPattern: "wait_time",
        message: "Mucha espera en caja",
      }),
      comment({
        id: "2",
        sentiment: "Positivo",
        dominantPattern: "customer_service",
        message: "Muy amables en barra",
      }),
    ]);

    expect(digest.topRiskAreas).toContain("Tiempo de espera");
    expect(digest.topStrengthAreas).toContain("Atención al cliente");
    expect(formatBranchDigestForPrompt(digest)).toContain("Tiempo de espera");
  });

  it("genera fingerprint estable por lote de comentarios", () => {
    const comments = [
      comment({ id: "b" }),
      comment({ id: "a" }),
    ];

    expect(buildCommentFingerprint(comments)).toBe("a|b");
  });
});

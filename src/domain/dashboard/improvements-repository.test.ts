import { describe, expect, it } from "vitest";

import { mapImprovementNarrativeRow } from "./improvements-repository";

describe("improvements-repository", () => {
  it("mapea filas guardadas al formato de la UI", () => {
    const mapped = mapImprovementNarrativeRow({
      id: "row-1",
      organization_id: "org-1",
      branch_id: "branch-1",
      branch_name: "Manantial",
      period: "7d",
      title: "Reducir espera en caja",
      narrative: "En [[Manantial]] detectamos [[2 casos]] de [[tiempo de espera]].",
      urgency: "esta semana",
      generated_by_llm: true,
      actor_user_id: null,
      generated_at: "2026-06-16T00:00:00.000Z",
      created_at: "2026-06-16T00:00:00.000Z",
      updated_at: "2026-06-16T00:00:00.000Z",
    });

    expect(mapped).toEqual({
      branchId: "branch-1",
      branch: "Manantial",
      title: "Reducir espera en caja",
      narrative:
        "En [[Manantial]] detectamos [[2 casos]] de [[tiempo de espera]].",
      urgency: "esta semana",
      generatedByLlm: true,
    });
  });
});

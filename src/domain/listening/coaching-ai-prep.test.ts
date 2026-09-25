import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearCoachingPrepCacheForTests,
  generateListeningCoachingPrep,
} from "./coaching-ai-prep";
import type { ListeningEventRow } from "./schemas";

afterEach(() => {
  clearCoachingPrepCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function event(partial: Partial<ListeningEventRow> = {}): ListeningEventRow {
  return {
    id: "event-1",
    organizationId: "org-1",
    branchId: null,
    branchName: null,
    userId: "user-1",
    userName: "Dennis",
    level: "download",
    levelLabel: "Descarga",
    note: "Detecta el tema del cliente",
    createdAt: "2026-08-18T12:00:00.000Z",
    ...partial,
  };
}

describe("generateListeningCoachingPrep", () => {
  it("reuses the same prep when events did not change", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-5.4-mini");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          usage: { input_tokens: 80, output_tokens: 40, total_tokens: 120 },
          output_text: JSON.stringify({
            insight: "Dennis viene cerrando en Descarga.",
            questions: ["¿Qué parte del flujo falló?", "¿Qué explorar antes de responder?"],
          }),
        }),
      ),
    );

    const first = await generateListeningCoachingPrep({
      events: [event()],
      userName: "Dennis",
      reasons: ["Cierre en Descarga"],
      organizationId: "org-1",
    });
    const second = await generateListeningCoachingPrep({
      events: [event()],
      userName: "Dennis",
      reasons: ["Cierre en Descarga"],
      organizationId: "org-1",
    });

    expect(first.generatedByLlm).toBe(true);
    expect(second.insight).toBe(first.insight);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

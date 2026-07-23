import { describe, expect, it } from "vitest";

import {
  listeningCoachingManagerPrompts,
  upsertListeningCoachingActionSchema,
} from "./schemas";

describe("listening coaching schemas", () => {
  it("provides private manager prompts for every listening level", () => {
    expect(listeningCoachingManagerPrompts.download).toHaveLength(2);
    expect(listeningCoachingManagerPrompts.debate).toHaveLength(2);
    expect(listeningCoachingManagerPrompts.empathetic_listening).toHaveLength(2);
    expect(listeningCoachingManagerPrompts.generative_dialogue).toHaveLength(2);
  });

  it("accepts a concrete coaching action", () => {
    const parsed = upsertListeningCoachingActionSchema.safeParse({
      subjectUserId: "11111111-1111-4111-8111-111111111111",
      actionText: "  Pedir un ejemplo antes de proponer.  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.actionText).toBe("Pedir un ejemplo antes de proponer.");
    }
  });
});

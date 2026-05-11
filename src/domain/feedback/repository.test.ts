import { describe, expect, it, vi } from "vitest";

import { insertFeedbackSubmission } from "./repository";

describe("insertFeedbackSubmission", () => {
  it("inserts feedback and returns the new row id", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "fb-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof insertFeedbackSubmission>[0];

    const result = await insertFeedbackSubmission(client, {
      branch_id: "b-1",
      type: "suggestion",
      emotion_score: 4,
      csat_score: null,
      nps_score: null,
      free_text: "El servicio estuvo muy bien.",
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      consent_accepted: true,
    });

    expect(result).toBe("fb-1");
  });

  it("throws when insert fails", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "DB error" },
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof insertFeedbackSubmission>[0];

    await expect(
      insertFeedbackSubmission(client, {
        branch_id: "b-1",
        type: "complaint",
        emotion_score: 1,
        csat_score: null,
        nps_score: null,
        free_text: "Muy mal servicio.",
        contact_name: null,
        contact_phone: null,
        contact_email: null,
        consent_accepted: true,
      }),
    ).rejects.toThrow("DB error");
  });
});

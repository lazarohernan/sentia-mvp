import { describe, expect, it } from "vitest";

import type { ListeningEventRow } from "@/domain/listening/schemas";
import { getListeningCollaboratorSummaries } from "./daily-summary";
import { getListeningCoachingPriorities } from "./coaching-priority";

function event(overrides: Partial<ListeningEventRow>): ListeningEventRow {
  return {
    id: overrides.id ?? "event-1",
    organizationId: "org-1",
    branchId: "branch-1",
    branchName: "Centro",
    userId: "user-1",
    userName: "Ana",
    level: "download",
    levelLabel: "Descarga",
    note: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("getListeningCoachingPriorities", () => {
  it("ranks collaborators with low listening signals first", () => {
    const events = [
      event({
        id: "a1",
        userId: "user-a",
        userName: "Ana",
        level: "download",
        levelLabel: "Descarga",
        createdAt: "2026-07-22T12:00:00.000Z",
      }),
      event({
        id: "a0",
        userId: "user-a",
        userName: "Ana",
        level: "empathetic_listening",
        levelLabel: "Escucha empatica",
        createdAt: "2026-07-10T12:00:00.000Z",
      }),
      event({
        id: "b1",
        userId: "user-b",
        userName: "Luis",
        level: "generative_dialogue",
        levelLabel: "Dialogo generativo",
        createdAt: "2026-07-22T12:00:00.000Z",
      }),
    ];

    const summaries = getListeningCollaboratorSummaries(events);
    const priorities = getListeningCoachingPriorities(summaries, events, {
      now: new Date("2026-07-22T18:00:00.000Z"),
    });

    expect(priorities[0]?.summary.userId).toBe("user-a");
    expect(priorities[0]?.urgency).toBe("high");
    expect(priorities.some((item) => item.summary.userId === "user-b")).toBe(
      false,
    );
  });
});

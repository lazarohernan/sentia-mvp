import { describe, expect, it } from "vitest";

import type { ListeningEventRow } from "@/domain/listening/schemas";
import {
  getListeningAverageSummary,
  getListeningCollaboratorSummaries,
  getListeningDailySummary,
  getListeningModeSummary,
} from "./daily-summary";

function event(overrides: Partial<ListeningEventRow>): ListeningEventRow {
  return {
    id: "event-1",
    organizationId: "org-1",
    branchId: "branch-1",
    branchName: "Norte",
    userId: "user-1",
    userName: "Usuario",
    level: "download",
    levelLabel: "Descarga",
    note: null,
    createdAt: "2026-06-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("getListeningDailySummary", () => {
  it("groups listening events by day and level", () => {
    const summary = getListeningDailySummary(
      [
        event({ level: "download", createdAt: "2026-06-01T12:00:00.000Z" }),
        event({ level: "debate", createdAt: "2026-06-01T20:00:00.000Z" }),
        event({
          level: "empathetic_listening",
          createdAt: "2026-06-02T14:00:00.000Z",
        }),
      ],
      {
        period: "custom",
        label: "Rango personalizado",
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        startIso: "2026-06-01T06:00:00.000Z",
        endIso: "2026-06-03T05:59:59.999Z",
      },
    );

    expect(summary).toMatchObject([
      { date: "2026-06-01", download: 1, debate: 1, total: 2 },
      { date: "2026-06-02", empatheticListening: 1, total: 1 },
    ]);
  });

  it("keeps empty days in the selected range", () => {
    const summary = getListeningDailySummary([], {
      period: "custom",
      label: "Rango personalizado",
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      startIso: "2026-06-01T06:00:00.000Z",
      endIso: "2026-06-04T05:59:59.999Z",
    });

    expect(summary.map((row) => row.total)).toEqual([0, 0, 0]);
  });
});

describe("getListeningAverageSummary", () => {
  it("calculates the average level score", () => {
    const average = getListeningAverageSummary([
      event({ level: "download" }),
      event({ level: "debate" }),
      event({ level: "empathetic_listening" }),
      event({ level: "generative_dialogue" }),
    ]);

    expect(average.averageLabel).toBe("2.5");
    expect(average.nearestLevelLabel).toBe("Escucha empatica");
  });

  it("returns an empty summary when there are no events", () => {
    expect(getListeningAverageSummary([])).toMatchObject({
      average: null,
      averageLabel: "Sin datos",
      nearestLevelLabel: "Sin datos",
    });
  });
});

describe("getListeningModeSummary", () => {
  it("returns the most frequent listening level", () => {
    const mode = getListeningModeSummary([
      event({ level: "debate" }),
      event({ level: "empathetic_listening" }),
      event({ level: "empathetic_listening" }),
    ]);

    expect(mode).toMatchObject({
      modeLabel: "Escucha empatica",
      count: 2,
      detail: "2 registros",
    });
  });

  it("returns a tie when more than one level has the same max count", () => {
    const mode = getListeningModeSummary([
      event({ level: "download" }),
      event({ level: "debate" }),
    ]);

    expect(mode.modeLabel).toBe("2 niveles");
    expect(mode.detail).toBe("Empate: Descarga, Debate");
  });

  it("returns an empty mode summary when there are no events", () => {
    expect(getListeningModeSummary([])).toMatchObject({
      modeLabel: "Sin datos",
      count: 0,
      detail: "Nivel más repetido",
    });
  });
});

describe("getListeningCollaboratorSummaries", () => {
  it("groups listening summaries by collaborator", () => {
    const summaries = getListeningCollaboratorSummaries([
      event({
        id: "event-1",
        userId: "user-1",
        userName: "Ana",
        level: "debate",
        note: "Primera nota",
        createdAt: "2026-06-01T12:00:00.000Z",
      }),
      event({
        id: "event-2",
        userId: "user-1",
        userName: "Ana",
        level: "empathetic_listening",
        note: "Última nota",
        createdAt: "2026-06-02T12:00:00.000Z",
      }),
      event({
        id: "event-3",
        userId: "user-2",
        userName: "Luis",
        level: "download",
      }),
    ]);

    expect(summaries[0]).toMatchObject({
      userId: "user-1",
      userName: "Ana",
      eventCount: 2,
      averageLabel: "2.5",
      modeLabel: "2 niveles",
      lastLevelLabel: "Escucha empatica",
      lastNote: "Última nota",
    });
    expect(summaries[1]).toMatchObject({
      userId: "user-2",
      userName: "Luis",
      eventCount: 1,
      averageLabel: "1.0",
      modeLabel: "Descarga",
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  buildHondurasDateRangeIso,
  isInstantInHondurasDateRange,
  toHondurasDateString,
} from "./honduras-time";
import { filterCommentsByHondurasDateWindow } from "./improvements-batch";
import type { DashboardCommentRow } from "./schemas";

function comment(createdAtIso: string): DashboardCommentRow {
  return {
    id: "comment-1",
    customer: "Cliente",
    business: "Negocio",
    branch: "Centro",
    branchId: "branch-1",
    feedbackType: "Observación",
    sentiment: "Riesgo",
    csatScore: 2,
    status: "Nuevo",
    message: "Mensaje",
    receivedAt: "hace 1 día",
    createdAtIso,
  };
}

describe("honduras-time", () => {
  it("convierte instantes UTC a fecha calendario de Honduras", () => {
    expect(toHondurasDateString("2026-06-08T06:00:00.000Z")).toBe("2026-06-08");
    expect(toHondurasDateString("2026-06-08T05:59:59.000Z")).toBe("2026-06-07");
  });

  it("delimita el inicio y fin del día en Honduras en UTC", () => {
    const bounds = buildHondurasDateRangeIso("2026-06-08", "2026-06-08");

    expect(bounds?.startIso).toBe("2026-06-08T06:00:00.000Z");
    expect(bounds?.endIso).toBe("2026-06-09T05:59:59.999Z");
  });

  it("filtra comentarios por ventana calendario hondureña", () => {
    const filtered = filterCommentsByHondurasDateWindow(
      [
        comment("2026-06-08T05:59:59.000Z"),
        comment("2026-06-08T06:00:00.000Z"),
        comment("2026-06-15T05:59:59.999Z"),
        comment("2026-06-15T06:00:00.000Z"),
      ],
      "2026-06-08",
      "2026-06-14",
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((item) => item.createdAtIso)).toEqual([
      "2026-06-08T06:00:00.000Z",
      "2026-06-15T05:59:59.999Z",
    ]);
  });

  it("valida pertenencia inclusiva por fecha local", () => {
    expect(isInstantInHondurasDateRange("2026-06-14T23:59:59.000Z", "2026-06-08", "2026-06-14")).toBe(
      true,
    );
    expect(isInstantInHondurasDateRange("2026-06-15T06:00:00.000Z", "2026-06-08", "2026-06-14")).toBe(
      false,
    );
  });
});

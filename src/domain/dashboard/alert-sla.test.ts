import { describe, expect, it } from "vitest";

import { getSlaHoursForUrgency, isSlaBreached } from "./alert-sla";

describe("alert-sla", () => {
  it("uses tighter windows for critical cases", () => {
    expect(getSlaHoursForUrgency("critical")).toBe(4);
    expect(getSlaHoursForUrgency("high")).toBe(24);
  });

  it("marks overdue open cases without first response", () => {
    const referenceDate = new Date("2026-06-02T12:00:00.000Z");

    expect(
      isSlaBreached({
        createdAtIso: "2026-06-01T10:00:00.000Z",
        urgency: "high",
        referenceDate,
      }),
    ).toBe(true);
  });

  it("does not flag responded or resolved cases", () => {
    expect(
      isSlaBreached({
        createdAtIso: "2026-06-01T10:00:00.000Z",
        urgency: "critical",
        firstResponseAt: "2026-06-01T10:30:00.000Z",
      }),
    ).toBe(false);
  });
});

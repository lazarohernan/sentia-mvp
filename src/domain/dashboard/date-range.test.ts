import { describe, expect, it } from "vitest";

import { getCalendarWeekWindow } from "./date-range";

describe("getCalendarWeekWindow", () => {
  it("ancla la semana al lunes y domingo en Honduras", () => {
    const week = getCalendarWeekWindow("2026-06-11");

    expect(week.startDate).toBe("2026-06-08");
    expect(week.endDate).toBe("2026-06-14");
    expect(week.weekKey).toBe("week:2026-06-08_2026-06-14");
  });
});

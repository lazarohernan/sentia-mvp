import { describe, expect, it } from "vitest";

import { updateListeningSettingsInputSchema } from "@/domain/listening/settings";

describe("updateListeningSettingsInputSchema", () => {
  it("normalizes reminder weekdays in platform order", () => {
    const parsed = updateListeningSettingsInputSchema.parse({
      remindersEnabled: true,
      reminderTimes: ["13:00", "09:00"],
      reminderWeekdays: ["fri", "mon", "fri", "wed"],
    });

    expect(parsed.reminderWeekdays).toEqual(["mon", "wed", "fri"]);
  });

  it("requires at least one reminder weekday", () => {
    const parsed = updateListeningSettingsInputSchema.safeParse({
      remindersEnabled: true,
      reminderTimes: ["09:00"],
      reminderWeekdays: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("allows empty reminder times when reminders are disabled", () => {
    const parsed = updateListeningSettingsInputSchema.parse({
      remindersEnabled: false,
      reminderTimes: [],
      reminderWeekdays: ["mon", "tue"],
    });

    expect(parsed.reminderTimes).toEqual([]);
  });

  it("requires at least one reminder time when reminders are enabled", () => {
    const parsed = updateListeningSettingsInputSchema.safeParse({
      remindersEnabled: true,
      reminderTimes: [],
      reminderWeekdays: ["mon", "tue"],
    });

    expect(parsed.success).toBe(false);
  });
});

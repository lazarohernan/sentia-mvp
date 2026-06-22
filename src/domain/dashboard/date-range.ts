import {
  addHondurasDays,
  buildHondurasDateRangeIso,
  formatHondurasDateLabel,
  getHondurasWeekdayIndex,
  toHondurasDateString,
} from "./honduras-time";

export type DashboardPeriod = "today" | "7d" | "30d" | "custom";

export type DashboardDateRange = {
  period: DashboardPeriod;
  label: string;
  startDate: string;
  endDate: string;
  startIso: string;
  endIso: string;
};

function buildRange(
  period: DashboardPeriod,
  label: string,
  startDate: string,
  endDate: string,
): DashboardDateRange {
  const bounds = buildHondurasDateRangeIso(startDate, endDate);
  if (!bounds) {
    return getDashboardDateRange({});
  }

  return {
    period,
    label,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    startIso: bounds.startIso,
    endIso: bounds.endIso,
  };
}

export function getDashboardDateRange(params: {
  period?: string;
  start?: string;
  end?: string;
}): DashboardDateRange {
  const today = toHondurasDateString(new Date());
  const sevenDaysStart = addHondurasDays(today, -6) ?? today;
  const thirtyDaysStart = addHondurasDays(today, -29) ?? today;

  if (params.period === "today") {
    return buildRange("today", "Hoy", today, today);
  }

  if (params.period === "30d") {
    return buildRange("30d", "Últimos 30 días", thirtyDaysStart, today);
  }

  if (params.period === "custom" && params.start && params.end) {
    return buildRange("custom", "Rango personalizado", params.start, params.end);
  }

  return buildRange("7d", "Últimos 7 días", sevenDaysStart, today);
}

export type CalendarWeekWindow = {
  weekKey: string;
  label: string;
  startDate: string;
  endDate: string;
  startIso: string;
  endIso: string;
};

export function getCalendarWeekWindow(referenceDate?: string): CalendarWeekWindow {
  const anchor = referenceDate ?? toHondurasDateString(new Date());
  const anchorBounds = buildHondurasDateRangeIso(anchor, anchor);
  if (!anchorBounds) {
    return getCalendarWeekWindow(toHondurasDateString(new Date()));
  }

  const dayIndex = getHondurasWeekdayIndex(anchorBounds.startIso);
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = addHondurasDays(anchor, mondayOffset) ?? anchor;
  const sunday = addHondurasDays(monday, 6) ?? anchor;
  const range = buildRange("custom", formatHondurasDateLabel(monday, sunday), monday, sunday);

  return {
    weekKey: `week:${monday}_${sunday}`,
    label: range.label,
    startDate: monday,
    endDate: sunday,
    startIso: range.startIso,
    endIso: range.endIso,
  };
}

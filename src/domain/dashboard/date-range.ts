export type DashboardPeriod = "today" | "7d" | "30d" | "custom";

export type DashboardDateRange = {
  period: DashboardPeriod;
  label: string;
  startDate: string;
  endDate: string;
  startIso: string;
  endIso: string;
};

const HONDURAS_UTC_OFFSET_HOURS = -6;
const HONDURAS_UTC_OFFSET_MS = HONDURAS_UTC_OFFSET_HOURS * 60 * 60 * 1000;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toHondurasDateParts(date: Date) {
  const shifted = new Date(date.getTime() + HONDURAS_UTC_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function toDateInputValue(date: Date) {
  const { year, month, day } = toHondurasDateParts(date);
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month) - 1,
    day: Number(day),
  };
}

function hondurasDayStartUtc(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) return null;

  return new Date(
    Date.UTC(parsed.year, parsed.month, parsed.day) - HONDURAS_UTC_OFFSET_MS,
  );
}

function addDays(value: string, days: number) {
  const start = hondurasDayStartUtc(value);
  if (!start) return null;

  return toDateInputValue(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

function buildRange(
  period: DashboardPeriod,
  label: string,
  startDate: string,
  endDate: string,
): DashboardDateRange {
  const start = hondurasDayStartUtc(startDate);
  const endStart = hondurasDayStartUtc(endDate);
  const end = endStart
    ? new Date(endStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    : null;

  if (!start || !end) {
    return getDashboardDateRange({});
  }

  return {
    period,
    label,
    startDate,
    endDate,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getDashboardDateRange(params: {
  period?: string;
  start?: string;
  end?: string;
}): DashboardDateRange {
  const today = toDateInputValue(new Date());
  const sevenDaysStart = addDays(today, -6) ?? today;
  const thirtyDaysStart = addDays(today, -29) ?? today;

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

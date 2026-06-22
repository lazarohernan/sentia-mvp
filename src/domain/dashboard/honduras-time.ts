export const HONDURAS_TIME_ZONE = "America/Tegucigalpa";

const HONDURAS_UTC_OFFSET_HOURS = -6;
const HONDURAS_UTC_OFFSET_MS = HONDURAS_UTC_OFFSET_HOURS * 60 * 60 * 1000;

const hondurasDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: HONDURAS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hondurasWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: HONDURAS_TIME_ZONE,
  weekday: "short",
});

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function parseHondurasDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month) - 1,
    day: Number(day),
  };
}

/** Fecha calendario YYYY-MM-DD en Honduras para un instante UTC. */
export function toHondurasDateString(input: Date | string = new Date()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    return toHondurasDateString(new Date());
  }

  return hondurasDateFormatter.format(date);
}

/** Inicio del día calendario en Honduras, expresado en UTC. */
export function hondurasDayStartUtc(value: string): Date | null {
  const parsed = parseHondurasDateInput(value);
  if (!parsed) {
    return null;
  }

  return new Date(
    Date.UTC(parsed.year, parsed.month, parsed.day) - HONDURAS_UTC_OFFSET_MS,
  );
}

/** Fin del día calendario en Honduras (23:59:59.999), expresado en UTC. */
export function hondurasDayEndUtc(value: string): Date | null {
  const start = hondurasDayStartUtc(value);
  if (!start) {
    return null;
  }

  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addHondurasDays(value: string, days: number): string | null {
  const start = hondurasDayStartUtc(value);
  if (!start) {
    return null;
  }

  return toHondurasDateString(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

export function getHondurasWeekdayIndex(input: Date | string): number {
  const date = typeof input === "string" ? new Date(input) : input;
  const weekday = hondurasWeekdayFormatter.format(date);
  return weekdayIndex[weekday] ?? 0;
}

export function isHondurasDateWithinRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  return date >= startDate && date <= endDate;
}

export function isInstantInHondurasDateRange(
  instantIso: string,
  startDate: string,
  endDate: string,
): boolean {
  const hondurasDate = toHondurasDateString(instantIso);
  return isHondurasDateWithinRange(hondurasDate, startDate, endDate);
}

export function buildHondurasDateRangeIso(startDate: string, endDate: string) {
  const start = hondurasDayStartUtc(startDate);
  const end = hondurasDayEndUtc(endDate);

  if (!start || !end) {
    return null;
  }

  return {
    startDate,
    endDate,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function formatHondurasDateLabel(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} a ${endDate}`;
}

export function toHondurasTimestampIso(input: Date = new Date()): string {
  return input.toISOString();
}

export function formatHondurasGeneratedLabel(input: Date | string = new Date()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: HONDURAS_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getHondurasHour(input: Date = new Date()): number {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone: HONDURAS_TIME_ZONE,
    hour: "numeric",
    hour12: false,
  })
    .formatToParts(input)
    .find((part) => part.type === "hour");

  return Number(hourPart?.value ?? 0);
}

export function getTimeOfDayGreetingInHonduras(input: Date = new Date()): string {
  const hour = getHondurasHour(input);

  if (hour < 12) {
    return "Buen día";
  }

  if (hour < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

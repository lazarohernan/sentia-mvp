import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import { listeningLevelLabels } from "@/domain/listening/schemas";

const HONDURAS_UTC_OFFSET_MS = -6 * 60 * 60 * 1000;

export type ListeningDailySummaryRow = {
  date: string;
  label: string;
  download: number;
  debate: number;
  empatheticListening: number;
  generativeDialogue: number;
  total: number;
};

export type ListeningAverageSummary = {
  average: number | null;
  averageLabel: string;
  nearestLevelLabel: string;
};

export type ListeningModeSummary = {
  modeLevelLabels: string[];
  modeLabel: string;
  count: number;
  detail: string;
};

export type ListeningCollaboratorSummary = {
  userId: string;
  userName: string;
  branchName: string;
  eventCount: number;
  averageLabel: string;
  nearestLevelLabel: string;
  modeLabel: string;
  modeDetail: string;
  lastLevelLabel: string;
  lastNote: string | null;
  lastCreatedAt: string;
};

const listeningLevelScores: Record<ListeningEventRow["level"], number> = {
  download: 1,
  debate: 2,
  empathetic_listening: 3,
  generative_dialogue: 4,
};

const scoreLevels: ListeningEventRow["level"][] = [
  "download",
  "debate",
  "empathetic_listening",
  "generative_dialogue",
];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateInputValue(date: Date) {
  const shifted = new Date(date.getTime() + HONDURAS_UTC_OFFSET_MS);

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`;
}

function hondurasDayStartUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day) - HONDURAS_UTC_OFFSET_MS);
}

function addDays(value: string, days: number) {
  return toDateInputValue(
    new Date(hondurasDayStartUtc(value).getTime() + days * 24 * 60 * 60 * 1000),
  );
}

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function createEmptyRow(date: string): ListeningDailySummaryRow {
  return {
    date,
    label: formatDayLabel(date),
    download: 0,
    debate: 0,
    empatheticListening: 0,
    generativeDialogue: 0,
    total: 0,
  };
}

export function getListeningDailySummary(
  events: ListeningEventRow[],
  dateRange: DashboardDateRange,
): ListeningDailySummaryRow[] {
  const rows = new Map<string, ListeningDailySummaryRow>();
  let currentDate = dateRange.startDate;

  while (currentDate <= dateRange.endDate) {
    rows.set(currentDate, createEmptyRow(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  for (const event of events) {
    const eventDate = toDateInputValue(new Date(event.createdAt));
    const row = rows.get(eventDate);

    if (!row) continue;

    if (event.level === "download") row.download += 1;
    if (event.level === "debate") row.debate += 1;
    if (event.level === "empathetic_listening") row.empatheticListening += 1;
    if (event.level === "generative_dialogue") row.generativeDialogue += 1;

    row.total += 1;
  }

  return [...rows.values()];
}

export function getListeningAverageSummary(
  events: ListeningEventRow[],
): ListeningAverageSummary {
  if (events.length === 0) {
    return {
      average: null,
      averageLabel: "Sin datos",
      nearestLevelLabel: "Sin datos",
    };
  }

  const totalScore = events.reduce(
    (sum, event) => sum + listeningLevelScores[event.level],
    0,
  );
  const average = totalScore / events.length;
  const nearestLevel = scoreLevels[Math.min(Math.max(Math.round(average), 1), 4) - 1];

  return {
    average,
    averageLabel: average.toFixed(1),
    nearestLevelLabel: listeningLevelLabels[nearestLevel],
  };
}

export function getListeningModeSummary(events: ListeningEventRow[]): ListeningModeSummary {
  if (events.length === 0) {
    return {
      modeLevelLabels: [],
      modeLabel: "Sin datos",
      count: 0,
      detail: "Nivel más repetido",
    };
  }

  const counts = new Map<ListeningEventRow["level"], number>(
    scoreLevels.map((level) => [level, 0]),
  );

  for (const event of events) {
    counts.set(event.level, (counts.get(event.level) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values());
  const modeLevels = scoreLevels.filter((level) => counts.get(level) === maxCount);
  const modeLevelLabels = modeLevels.map((level) => listeningLevelLabels[level]);

  return {
    modeLevelLabels,
    modeLabel:
      modeLevelLabels.length === 1
        ? modeLevelLabels[0]
        : `${modeLevelLabels.length} niveles`,
    count: maxCount,
    detail:
      modeLevelLabels.length === 1
        ? `${maxCount} registro${maxCount === 1 ? "" : "s"}`
        : `Empate: ${modeLevelLabels.join(", ")}`,
  };
}

export function getListeningCollaboratorSummaries(
  events: ListeningEventRow[],
): ListeningCollaboratorSummary[] {
  const groupedEvents = new Map<string, ListeningEventRow[]>();

  for (const event of events) {
    groupedEvents.set(event.userId, [...(groupedEvents.get(event.userId) ?? []), event]);
  }

  return [...groupedEvents.entries()]
    .map(([userId, userEvents]) => {
      const sortedEvents = [...userEvents].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      const latestEvent = sortedEvents[0];
      const average = getListeningAverageSummary(sortedEvents);
      const mode = getListeningModeSummary(sortedEvents);
      const branchNames = [
        ...new Set(
          sortedEvents.map((event) => event.branchName).filter((name): name is string => Boolean(name)),
        ),
      ];

      return {
        userId,
        userName: latestEvent.userName,
        branchName:
          branchNames.length === 0
            ? "Sin sucursal"
            : branchNames.length === 1
              ? branchNames[0]
              : `${branchNames.length} sucursales`,
        eventCount: sortedEvents.length,
        averageLabel: average.averageLabel,
        nearestLevelLabel: average.nearestLevelLabel,
        modeLabel: mode.modeLabel,
        modeDetail: mode.detail,
        lastLevelLabel: listeningLevelLabels[latestEvent.level],
        lastNote: latestEvent.note,
        lastCreatedAt: latestEvent.createdAt,
      };
    })
    .sort((left, right) => right.eventCount - left.eventCount);
}

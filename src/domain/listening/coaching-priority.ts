import type { ListeningCollaboratorSummary } from "@/domain/listening/daily-summary";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import { listeningLevelLabels } from "@/domain/listening/schemas";

const levelScore: Record<ListeningEventRow["level"], number> = {
  download: 1,
  debate: 2,
  empathetic_listening: 3,
  generative_dialogue: 4,
};

export type CoachingUrgency = "high" | "medium";

export type CoachingPriorityItem = {
  summary: ListeningCollaboratorSummary;
  urgency: CoachingUrgency;
  score: number;
  reasons: string[];
};

function daysSince(isoDate: string, now = new Date()) {
  const ms = now.getTime() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function scoreCollaborator(
  summary: ListeningCollaboratorSummary,
  events: ListeningEventRow[],
  now = new Date(),
): CoachingPriorityItem | null {
  if (!summary.userId || summary.userId.startsWith("deleted:")) {
    return null;
  }

  const sorted = [...events]
    .filter((event) => event.userId === summary.userId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  if (sorted.length === 0) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];
  const latest = sorted[0];
  const previous = sorted[1];
  const idleDays = daysSince(latest.createdAt, now);

  if (latest.level === "download") {
    score += 3;
    reasons.push("Último nivel en Descarga");
  } else if (latest.level === "debate") {
    score += 2;
    reasons.push("Último nivel en Debate");
  }

  if (
    previous &&
    levelScore[latest.level] < levelScore[previous.level]
  ) {
    score += 3;
    reasons.push(
      `Bajó de ${listeningLevelLabels[previous.level]} a ${listeningLevelLabels[latest.level]}`,
    );
  }

  if (idleDays >= 14) {
    score += 3;
    reasons.push(`Sin registro hace ${idleDays} días`);
  } else if (idleDays >= 7) {
    score += 2;
    reasons.push(`Sin registro hace ${idleDays} días`);
  }

  const averageScore =
    sorted.reduce((total, event) => total + levelScore[event.level], 0) /
    sorted.length;

  if (averageScore <= 2) {
    score += 2;
    reasons.push("Media del periodo baja");
  }

  if (
    summary.modeLabel === listeningLevelLabels.download ||
    summary.modeLabel === listeningLevelLabels.debate
  ) {
    score += 1;
    if (!reasons.some((reason) => reason.includes("Media"))) {
      reasons.push(`Moda en ${summary.modeLabel}`);
    }
  }

  if (score < 3) {
    return null;
  }

  return {
    summary,
    urgency: score >= 5 ? "high" : "medium",
    score,
    reasons: reasons.slice(0, 3),
  };
}

export function getListeningCoachingPriorities(
  summaries: ListeningCollaboratorSummary[],
  events: ListeningEventRow[],
  options?: {
    limit?: number;
    now?: Date;
  },
): CoachingPriorityItem[] {
  const limit = options?.limit ?? 5;
  const now = options?.now ?? new Date();

  return summaries
    .map((summary) => scoreCollaborator(summary, events, now))
    .filter((item): item is CoachingPriorityItem => Boolean(item))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.summary.userName.localeCompare(right.summary.userName);
    })
    .slice(0, limit);
}

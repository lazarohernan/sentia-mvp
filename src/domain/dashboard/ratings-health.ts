export type CsatHealthZone = "risk" | "observation" | "good";

export type RatingsHealthMetrics = {
  totalCount: number;
  scoredCount: number;
  averageCsat: number | null;
  zone: CsatHealthZone | "none";
  label: string;
  zoneCounts: Record<CsatHealthZone, number>;
  zonePercents: Record<CsatHealthZone, number>;
};

export function classifyCsatScore(score: number): CsatHealthZone {
  if (score < 3) {
    return "risk";
  }

  if (score < 4) {
    return "observation";
  }

  return "good";
}

export function getHealthLabelFromAverage(average: number): {
  zone: CsatHealthZone;
  label: string;
} {
  if (average >= 4) {
    return { zone: "good", label: "Bueno" };
  }

  if (average >= 3) {
    return { zone: "observation", label: "Observación" };
  }

  return { zone: "risk", label: "Riesgo" };
}

function emptyZoneCounts(): Record<CsatHealthZone, number> {
  return { risk: 0, observation: 0, good: 0 };
}

function emptyZonePercents(): Record<CsatHealthZone, number> {
  return { risk: 0, observation: 0, good: 0 };
}

export function computeRatingsHealth(params: {
  scores: number[];
  totalCount?: number;
}): RatingsHealthMetrics {
  const totalCount = params.totalCount ?? params.scores.length;
  const scoredCount = params.scores.length;

  if (scoredCount === 0) {
    return {
      totalCount,
      scoredCount: 0,
      averageCsat: null,
      zone: "none",
      label: "Sin datos",
      zoneCounts: emptyZoneCounts(),
      zonePercents: emptyZonePercents(),
    };
  }

  const zoneCounts = emptyZoneCounts();

  for (const score of params.scores) {
    zoneCounts[classifyCsatScore(score)] += 1;
  }

  const averageCsat =
    params.scores.reduce((sum, score) => sum + score, 0) / scoredCount;
  const { zone, label } = getHealthLabelFromAverage(averageCsat);

  const zonePercents = {
    risk: Math.round((zoneCounts.risk / scoredCount) * 100),
    observation: Math.round((zoneCounts.observation / scoredCount) * 100),
    good: Math.round((zoneCounts.good / scoredCount) * 100),
  };

  return {
    totalCount,
    scoredCount,
    averageCsat,
    zone,
    label,
    zoneCounts,
    zonePercents,
  };
}

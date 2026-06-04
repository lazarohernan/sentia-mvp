import { describe, expect, it } from "vitest";

import {
  classifyCsatScore,
  computeRatingsHealth,
  getHealthLabelFromAverage,
} from "./ratings-health";

describe("classifyCsatScore", () => {
  it("maps low scores to risk", () => {
    expect(classifyCsatScore(1)).toBe("risk");
    expect(classifyCsatScore(2)).toBe("risk");
  });

  it("maps neutral score to observation", () => {
    expect(classifyCsatScore(3)).toBe("observation");
  });

  it("maps high scores to good", () => {
    expect(classifyCsatScore(4)).toBe("good");
    expect(classifyCsatScore(5)).toBe("good");
  });
});

describe("getHealthLabelFromAverage", () => {
  it("labels average at or above 4 as good", () => {
    expect(getHealthLabelFromAverage(4.2)).toEqual({
      zone: "good",
      label: "Bueno",
    });
  });
});

describe("computeRatingsHealth", () => {
  it("returns empty metrics when there are no scores", () => {
    expect(computeRatingsHealth({ scores: [], totalCount: 0 })).toMatchObject({
      averageCsat: null,
      label: "Sin datos",
      zone: "none",
      zonePercents: { risk: 0, observation: 0, good: 0 },
    });
  });

  it("calculates average and zone distribution", () => {
    const metrics = computeRatingsHealth({
      scores: [5, 5, 2, 3],
      totalCount: 4,
    });

    expect(metrics.averageCsat).toBe(3.75);
    expect(metrics.label).toBe("Observación");
    expect(metrics.zoneCounts).toEqual({
      risk: 1,
      observation: 1,
      good: 2,
    });
    expect(metrics.zonePercents).toEqual({
      risk: 25,
      observation: 25,
      good: 50,
    });
  });
});

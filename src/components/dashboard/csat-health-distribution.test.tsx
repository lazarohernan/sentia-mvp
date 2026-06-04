import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CsatHealthDistributionBar } from "./csat-health-distribution";

describe("CsatHealthDistributionBar", () => {
  it("renders visible colored bars with explicit height", () => {
    render(
      <CsatHealthDistributionBar
        zonePercents={{ risk: 25, observation: 25, good: 50 }}
        zoneCounts={{ risk: 1, observation: 1, good: 2 }}
        showExplanation={false}
        size="wide"
      />,
    );

    const riskBar = screen.getByTestId("csat-health-bar-risk");
    expect(riskBar).toHaveClass("bg-red-500");
    expect(riskBar.style.height).not.toBe("0px");
    expect(Number.parseFloat(riskBar.style.height)).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";

import {
  getReportCadenceMeta,
  getReportCadenceSettingMeta,
  getReportCadenceTargets,
  resolveReportPeriod,
} from "./report-cadence";

describe("report cadence", () => {
  it("uses lighter targets for weekly reports", () => {
    expect(getReportCadenceTargets("weekly")).toEqual({
      perBranch: 2,
      minimum: 4,
    });
    expect(getReportCadenceTargets("monthly")).toEqual({
      perBranch: 8,
      minimum: 12,
    });
  });

  it("returns cadence-specific labels", () => {
    expect(getReportCadenceMeta("weekly").previewTitle).toBe("Informe semanal");
    expect(getReportCadenceMeta("monthly").previewTitle).toBe("Informe mensual");
    expect(getReportCadenceSettingMeta("both").label).toBe("Semanal y mensual");
  });

  it("resolves both cadence with an active period", () => {
    expect(resolveReportPeriod("both", "weekly")).toBe("weekly");
    expect(resolveReportPeriod("both", "monthly")).toBe("monthly");
    expect(resolveReportPeriod("monthly", "weekly")).toBe("monthly");
  });
});

import { describe, expect, it } from "vitest";

import {
  buildInformesNotificationHref,
  getDashboardViewFromNotificationHref,
  parseInformesNavigation,
} from "./navigation";

describe("notification navigation", () => {
  it("builds informes deep links with report period", () => {
    expect(buildInformesNotificationHref("weekly")).toBe(
      "/dashboard?reportPeriod=weekly#informes",
    );
    expect(buildInformesNotificationHref("monthly", { openReport: true })).toBe(
      "/dashboard?reportPeriod=monthly&openReport=1#informes",
    );
  });

  it("parses informes navigation from search params", () => {
    const params = new URLSearchParams("reportPeriod=monthly&openReport=1");
    expect(parseInformesNavigation({ searchParams: params })).toEqual({
      reportPeriod: "monthly",
      autoOpenReport: true,
    });
  });

  it("maps notification hrefs to dashboard views", () => {
    expect(
      getDashboardViewFromNotificationHref(
        "/dashboard?reportPeriod=weekly&openReport=1#informes",
      ),
    ).toBe("informes");
    expect(getDashboardViewFromNotificationHref("/dashboard#alertas")).toBe(
      "alertas",
    );
  });
});

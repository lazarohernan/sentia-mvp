import { describe, expect, it } from "vitest";

import { isGuidedDemoEnabled, landingLoginCtaLabel } from "./guided-demo";

describe("guided demo visibility", () => {
  it("is available in local and test environments", () => {
    expect(isGuidedDemoEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isGuidedDemoEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(landingLoginCtaLabel({ NODE_ENV: "development" })).toBe("Entrar a la demo");
  });

  it("is hidden in production and uses Iniciar sesión", () => {
    expect(isGuidedDemoEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(landingLoginCtaLabel({ NODE_ENV: "production" })).toBe("Iniciar sesión");
  });
});

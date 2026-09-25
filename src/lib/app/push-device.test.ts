import { describe, expect, it } from "vitest";

import { isAppleMobileDevice, requiresStandaloneForWebPush } from "./push-device";

describe("isAppleMobileDevice", () => {
  it("detects any browser on an iPhone, not only Safari", () => {
    expect(
      isAppleMobileDevice({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0.0.0 Mobile/15E148 Safari/604.1",
      }),
    ).toBe(true);
  });

  it("detects Android phones as not Apple", () => {
    expect(
      isAppleMobileDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      }),
    ).toBe(false);
  });

  it("detects iPadOS that reports itself as Macintosh", () => {
    expect(
      isAppleMobileDevice({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("does not treat a Mac desktop as a phone", () => {
    expect(
      isAppleMobileDevice({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
      }),
    ).toBe(false);
  });
});

describe("requiresStandaloneForWebPush", () => {
  it("is false for a probe that is not an Apple phone or tablet", () => {
    expect(
      requiresStandaloneForWebPush({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      }),
    ).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";

import {
  clearRateLimitStore,
  consumeRateLimit,
  getClientIpFromHeaders,
} from "./rate-limit";

describe("consumeRateLimit", () => {
  afterEach(() => {
    clearRateLimitStore();
  });

  it("blocks requests after the configured limit", () => {
    const first = consumeRateLimit({
      namespace: "test",
      key: "ip:1",
      limit: 2,
      windowMs: 1000,
      now: 100,
    });
    const second = consumeRateLimit({
      namespace: "test",
      key: "ip:1",
      limit: 2,
      windowMs: 1000,
      now: 200,
    });
    const third = consumeRateLimit({
      namespace: "test",
      key: "ip:1",
      limit: 2,
      windowMs: 1000,
      now: 300,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("resets the window after expiration", () => {
    consumeRateLimit({
      namespace: "test",
      key: "ip:2",
      limit: 1,
      windowMs: 1000,
      now: 100,
    });
    const retried = consumeRateLimit({
      namespace: "test",
      key: "ip:2",
      limit: 1,
      windowMs: 1000,
      now: 1201,
    });

    expect(retried.allowed).toBe(true);
  });
});

describe("getClientIpFromHeaders", () => {
  it("prefers the first forwarded IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.10");
  });
});

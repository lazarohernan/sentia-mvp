import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearRateLimitStore,
  consumeDistributedRateLimit,
  consumeRateLimit,
  getClientIpFromHeaders,
} from "./rate-limit";

describe("consumeRateLimit", () => {
  afterEach(() => {
    clearRateLimitStore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  it("uses Upstash Redis REST when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          { result: 3 },
          { result: 1 },
          { result: 120_000 },
        ]),
      ),
    );

    const result = await consumeDistributedRateLimit({
      namespace: "api:test",
      key: "203.0.113.10",
      limit: 2,
      windowMs: 120_000,
    });

    expect(result).toMatchObject({
      allowed: false,
      remaining: 0,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://redis.example.com/pipeline",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      }),
    );
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

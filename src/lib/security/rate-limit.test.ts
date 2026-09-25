import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearRateLimitStore,
  consumeAuthRateLimit,
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

  it("fails closed when a distributed store is required but missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const result = await consumeDistributedRateLimit({
      namespace: "auth:test",
      key: "account",
      limit: 5,
      windowMs: 60_000,
      requireDistributed: true,
    });

    expect(result).toMatchObject({ allowed: false, unavailable: true });
  });

  it("requires the distributed store for authentication in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const result = await consumeAuthRateLimit({
      namespace: "auth:sign-in",
      key: "account",
      limit: 5,
      windowMs: 60_000,
    });

    expect(result).toMatchObject({ allowed: false, unavailable: true });
  });

  it("fails closed when the configured store is unavailable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({}, { status: 503 })));

    const result = await consumeDistributedRateLimit({
      namespace: "auth:test",
      key: "account",
      limit: 5,
      windowMs: 60_000,
      requireDistributed: true,
    });

    expect(result).toMatchObject({ allowed: false, unavailable: true });
  });

  it("fails closed when the store returns an invalid counter", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([{ result: "bad" }, { result: 1 }, { result: 60_000 }])),
    );

    const result = await consumeDistributedRateLimit({
      namespace: "auth:test",
      key: "account",
      limit: 5,
      windowMs: 60_000,
      requireDistributed: true,
    });

    expect(result).toMatchObject({ allowed: false, unavailable: true });
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

type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitWindow>;
type RateLimitParams = {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
  requireDistributed?: boolean;
};
type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  unavailable?: boolean;
};

declare global {
  var __escuchaRateLimitStore: RateLimitStore | undefined;
}

function getStore() {
  if (!globalThis.__escuchaRateLimitStore) {
    globalThis.__escuchaRateLimitStore = new Map();
  }

  return globalThis.__escuchaRateLimitStore;
}

export function getClientIpFromHeaders(
  headersLike: Pick<Headers, "get">,
  fallback = "unknown",
) {
  const forwardedFor = headersLike.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = headersLike.get("x-real-ip") ?? headersLike.get("cf-connecting-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return fallback;
}

export function consumeRateLimit(params: RateLimitParams) {
  const now = params.now ?? Date.now();
  const scopedKey = `${params.namespace}:${params.key}`;
  const store = getStore();
  const current = store.get(scopedKey);

  if (!current || current.resetAt <= now) {
    const resetAt = now + params.windowMs;
    store.set(scopedKey, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      resetAt,
    };
  }

  const nextCount = current.count + 1;
  current.count = nextCount;
  store.set(scopedKey, current);

  return {
    allowed: nextCount <= params.limit,
    remaining: Math.max(0, params.limit - nextCount),
    resetAt: current.resetAt,
  };
}

function getUpstashRateLimitEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

type UpstashCommandResult = {
  result?: unknown;
  error?: string;
};

function numericResult(row: UpstashCommandResult | undefined, fallback: number) {
  const value = row?.result;
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export async function consumeDistributedRateLimit(
  params: RateLimitParams,
): Promise<RateLimitResult> {
  const unavailable = () => ({
    allowed: false,
    remaining: 0,
    resetAt: 0,
    unavailable: true,
  });
  const fallback = () =>
    params.requireDistributed ? unavailable() : consumeRateLimit(params);
  const upstash = getUpstashRateLimitEnv();
  if (!upstash) {
    return fallback();
  }

  const now = params.now ?? Date.now();
  const redisKey = `rate-limit:${params.namespace}:${params.key}`;

  try {
    const response = await fetch(`${upstash.url}/pipeline`, {
      method: "POST",
      signal: AbortSignal.timeout(3_000),
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, params.windowMs, "NX"],
        ["PTTL", redisKey],
      ]),
    });

    if (!response.ok) {
      return fallback();
    }

    const rows = (await response.json()) as UpstashCommandResult[];
    if (!Array.isArray(rows) || rows.some((row) => row.error)) {
      return fallback();
    }

    const count = numericResult(rows[0], Number.NaN);
    const ttl = numericResult(rows[2], Number.NaN);
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(ttl) || ttl < 0) {
      return fallback();
    }

    return {
      allowed: count <= params.limit,
      remaining: Math.max(0, params.limit - count),
      resetAt: now + ttl,
    };
  } catch {
    return fallback();
  }
}

export function consumeAuthRateLimit(params: RateLimitParams) {
  return consumeDistributedRateLimit({
    ...params,
    requireDistributed: process.env.NODE_ENV === "production",
  });
}

export function clearRateLimitStore() {
  getStore().clear();
}

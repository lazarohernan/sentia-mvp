type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitWindow>;

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

export function consumeRateLimit(params: {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}) {
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

export function clearRateLimitStore() {
  getStore().clear();
}

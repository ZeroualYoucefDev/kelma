/**
 * Shared HTTP primitives for every external linguistics provider.
 *
 * All calls are server-side, time-boxed and cached in-process so a single
 * lesson never hammers a public endpoint. Failures are surfaced to callers
 * which decide whether to degrade gracefully.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = Number(process.env.LINGUISTICS_CACHE_TTL_SECONDS ?? 86_400) * 1000;

export function fromCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function toCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL): T {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs } satisfies CacheEntry<T>);
  return value;
}

/** Cached, timeout-bounded JSON fetch. Throws on network or HTTP errors. */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 8_000,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": "Lumio/1.0 (+https://github.com)",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Upstream ${new URL(url).hostname} responded ${response.status}`);
  }

  return (await response.json()) as T;
}

/** Cached text fetch for newline-delimited public datasets. */
export async function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": "Lumio/1.0 (+https://github.com)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Upstream ${new URL(url).hostname} responded ${response.status}`);
  }
  return response.text();
}

/** Small deterministic PRNG so a lesson's option order stays stable. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Decode the small subset of HTML entities public translation APIs return. */
export function decodeEntities(input: string): string {
  const entities: Record<string, string> = {
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };
  return input.replace(/&(?:quot|#39|apos|amp|lt|gt|nbsp);/g, (match) => entities[match] ?? match);
}

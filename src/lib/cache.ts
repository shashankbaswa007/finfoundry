/**
 * In-memory TTL cache for API route responses.
 * Prevents redundant Firestore reads for public data.
 *
 * Default TTL: 5 minutes — meaning all visitors in 5m = 1 read, not N.
 * Stale-while-revalidate: returns stale data immediately while
 * background-refreshing, so users never wait for Firestore.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes — warm instances share cache across requests

/**
 * Get cached value, or fetch fresh if expired/missing.
 * Uses stale-while-revalidate: if data is stale, returns it
 * immediately and triggers a background refresh.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  // Fresh hit — return immediately
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  // Stale hit — return stale data, revalidate in background
  if (entry) {
    if (!inflight.has(key)) {
      const refresh = fetcher().then((data) => {
        store.set(key, { data, expiresAt: Date.now() + ttlMs });
        inflight.delete(key);
        return data;
      }).catch(() => { inflight.delete(key); });
      inflight.set(key, refresh);
    }
    return entry.data;
  }

  // Cold miss — must wait for fetch (deduplicate concurrent requests)
  if (inflight.has(key)) {
    return inflight.get(key) as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}

/** Invalidate a specific cache key (call after mutations). */
export function invalidate(key: string): void {
  store.delete(key);
  inflight.delete(key);
}

/** Invalidate all cache entries. */
export function invalidateAll(): void {
  store.clear();
  inflight.clear();
}

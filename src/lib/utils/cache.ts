interface CacheState<T> {
  value: T | null;
  promise: Promise<T> | null;
}

const loaderCache = new WeakMap<() => Promise<unknown>, CacheState<unknown>>();

/**
 * Custom promise memoization utility.
 *
 * WHY CUSTOM: No library provides this exact combination of semantics:
 * - Promise deduplication: concurrent calls receive the SAME promise object,
 *   preventing redundant async work (p-memoize and memoizee do not guarantee this)
 * - init callback: called exactly once when the value is ready
 * - External reset: resetLoaderCache() can invalidate cache from outside using
 *   WeakMap keyed by the returned function (library clear() methods are internal)
 *
 * If a future library provides all three semantics, this can be replaced.
 */
export function createCachedLoader<T>(
  loader: () => T | Promise<T>,
  options?: { init?: (_value: T) => void }
): () => Promise<T> {
  const state: CacheState<T> = { value: null, promise: null };

  const cachedLoader = (): Promise<T> => {
    if (state.value) {
      return Promise.resolve(state.value);
    }

    if (!state.promise) {
      state.promise = Promise.resolve(loader()).then((result) => {
        options?.init?.(result);
        state.value = result;
        return result;
      });
    }

    return state.promise;
  };

  loaderCache.set(cachedLoader, state as CacheState<unknown>);
  return cachedLoader;
}

/**
 * Resets the cache for a given cached loader, forcing the next call to re-fetch.
 * @param loader - The cached loader function returned by createCachedLoader
 */
export function resetLoaderCache<T>(loader: () => Promise<T>): void {
  const state = loaderCache.get(loader as () => Promise<unknown>);
  if (state) {
    state.value = null;
    state.promise = null;
  }
}

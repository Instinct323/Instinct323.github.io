interface CacheState<T> {
  value: T | null;
  promise: Promise<T> | null;
}

/**
 * Custom promise memoization utility.
 *
 * WHY CUSTOM: No library provides this exact combination of semantics:
 * - Promise deduplication: concurrent calls receive the SAME promise object,
 *   preventing redundant async work (p-memoize and memoizee do not guarantee this)
 * - init callback: called exactly once when the value is ready
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

  return cachedLoader;
}

function _resetLoaderCache<T>(_loader: () => Promise<T>): void {
}

interface CacheState<T> {
  value: T | null;
  promise: Promise<T> | null;
}

const loaderCache = new WeakMap<() => Promise<unknown>, CacheState<unknown>>();

/**
 * Creates a cached loader function. Caches value and promise in all environments.
 * @param loader - Function that returns data (sync or async)
 * @param options - Optional init callback called when value is ready
 * @returns A function that returns a Promise resolving to the loaded data
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

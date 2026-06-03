import { describe, expect, it, vi } from 'vitest';
import { createCachedLoader, resetLoaderCache } from './cache';

describe('createCachedLoader', () => {
  it('caches value and returns it on subsequent calls without re-invoking loader', async () => {
    const loader = vi.fn().mockResolvedValue('cached-result');
    const cachedLoader = createCachedLoader(loader);

    const result1 = await cachedLoader();
    const result2 = await cachedLoader();

    expect(result1).toBe('cached-result');
    expect(result2).toBe('cached-result');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('returns same promise for concurrent calls (deduplication)', async () => {
    let resolveFirst: (_value: string) => void;
    const firstCall = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    const loader = vi.fn().mockImplementation(() => firstCall);
    const cachedLoader = createCachedLoader(loader);

    const call1 = cachedLoader();
    const call2 = cachedLoader();
    expect(call1).toBe(call2); // same promise

    resolveFirst!('deduped-result');

    const [result1, result2] = await Promise.all([call1, call2]);

    expect(result1).toBe('deduped-result');
    expect(result2).toBe('deduped-result');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('calls init callback with loaded value on first call', async () => {
    const init = vi.fn();
    const loader = vi.fn().mockResolvedValue('init-value');
    const cachedLoader = createCachedLoader(loader, { init });

    await cachedLoader();

    expect(init).toHaveBeenCalledWith('init-value');
  });

  it('handles synchronous loader values', async () => {
    const loader = vi.fn().mockReturnValue('sync-result');
    const cachedLoader = createCachedLoader(loader);

    const result1 = await cachedLoader();
    const result2 = await cachedLoader();

    expect(result1).toBe('sync-result');
    expect(result2).toBe('sync-result');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('resetLoaderCache', () => {
  it('forces the loader to re-invoke on next call', async () => {
    const loader = vi.fn().mockResolvedValue('cached-result');
    const cachedLoader = createCachedLoader(loader);

    const result1 = await cachedLoader();
    expect(result1).toBe('cached-result');
    expect(loader).toHaveBeenCalledTimes(1);

    resetLoaderCache(cachedLoader);

    const result2 = await cachedLoader();
    expect(result2).toBe('cached-result');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does nothing for an unknown loader', () => {
    const unknownLoader = vi.fn() as () => Promise<string>;
    expect(() => resetLoaderCache(unknownLoader)).not.toThrow();
  });
});

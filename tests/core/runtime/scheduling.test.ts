import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runWhenIdle } from '~/core/runtime/scheduling';

describe('runWhenIdle', () => {
  let mockRequestIdleCallback: ReturnType<typeof vi.fn>;
  let mockSetTimeout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    });
    mockSetTimeout = vi.fn((cb: () => void) => {
      cb();
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses requestIdleCallback with default timeout when available', () => {
    vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
    const callback = vi.fn();
    runWhenIdle(callback);
    expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 1000 });
    expect(callback).toHaveBeenCalled();
  });

  it('uses requestIdleCallback with explicit timeout when available', () => {
    vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
    const callback = vi.fn();
    runWhenIdle(callback, { timeout: 500 });
    expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 500 });
    expect(callback).toHaveBeenCalled();
  });

  it('falls back to setTimeout with default timeout when requestIdleCallback is unavailable', () => {
    Reflect.deleteProperty(window, 'requestIdleCallback');
    vi.stubGlobal('setTimeout', mockSetTimeout);
    const callback = vi.fn();
    runWhenIdle(callback);
    expect(mockSetTimeout).toHaveBeenCalledWith(callback, 1000);
    expect(callback).toHaveBeenCalled();
  });

  it('falls back to setTimeout with explicit timeout when requestIdleCallback is unavailable', () => {
    Reflect.deleteProperty(window, 'requestIdleCallback');
    vi.stubGlobal('setTimeout', mockSetTimeout);
    const callback = vi.fn();
    runWhenIdle(callback, { timeout: 200 });
    expect(mockSetTimeout).toHaveBeenCalledWith(callback, 200);
    expect(callback).toHaveBeenCalled();
  });
});

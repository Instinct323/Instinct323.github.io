import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { initDeferredMountGroupSafely } from '~/core/runtime/deferred-mount-init';
import { initDeferredMounts } from '~/core/runtime/deferred-mount';

describe('initDeferredMountGroupSafely', () => {
  it('does not throw when container is missing', () => {
    expect(() =>
      initDeferredMountGroupSafely(
        { containerSelector: '.does-not-exist', configDataKey: 'noKey', mountGroup: 'noGroup' },
        'test-context',
      ),
    ).not.toThrow();
  });
});

describe('initDeferredMounts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('does not modify detached nodes after delay', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-deferred-group="test" data-deferred-mount="true" data-deferred-state="loading" aria-busy="true">
        <template data-deferred-template><span>content</span></template>
        <div data-deferred-host></div>
        <div data-deferred-placeholder><span data-deferred-placeholder-text>Loading...</span></div>
      </div>
    `;
    document.body.appendChild(container);
    const node = container.querySelector<HTMLElement>('[data-deferred-mount]')!;

    Reflect.deleteProperty(window, 'IntersectionObserver');

    initDeferredMounts({ selector: '[data-deferred-group="test"][data-deferred-mount="true"]', rootMargin: '0px', mountDelayMs: 50 });

    node.remove();
    vi.advanceTimersByTime(100);

    expect(node.dataset.deferredState).toBe('loading');
    expect(node.getAttribute('aria-busy')).toBe('true');
  });

  it('mounts connected nodes after delay', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-deferred-group="test" data-deferred-mount="true" data-deferred-state="loading" aria-busy="true">
        <template data-deferred-template><span>content</span></template>
        <div data-deferred-host></div>
        <div data-deferred-placeholder><span data-deferred-placeholder-text>Loading...</span></div>
      </div>
    `;
    document.body.appendChild(container);
    const node = container.querySelector<HTMLElement>('[data-deferred-mount]')!;

    Reflect.deleteProperty(window, 'IntersectionObserver');

    initDeferredMounts({ selector: '[data-deferred-group="test"][data-deferred-mount="true"]', rootMargin: '0px', mountDelayMs: 50 });

    vi.advanceTimersByTime(100);

    expect(node.dataset.deferredState).toBe('loaded');
    expect(node.getAttribute('aria-busy')).toBe('false');
  });

  it('falls back to delayed mounting when IntersectionObserver construction throws', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div data-deferred-group="test" data-deferred-mount="true" data-deferred-state="loading" aria-busy="true">
        <template data-deferred-template><span>content</span></template>
        <div data-deferred-host></div>
        <div data-deferred-placeholder><span data-deferred-placeholder-text>Loading...</span></div>
      </div>
    `;
    document.body.appendChild(container);
    const node = container.querySelector<HTMLElement>('[data-deferred-mount]')!;

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          throw new SyntaxError('Invalid rootMargin');
        }
      },
    );

    initDeferredMounts({ selector: '[data-deferred-group="test"][data-deferred-mount="true"]', rootMargin: 'invalid', mountDelayMs: 50 });

    expect(node.dataset.deferredState).toBe('loading');
    vi.advanceTimersByTime(50);

    expect(node.dataset.deferredState).toBe('loaded');
    expect(node.getAttribute('aria-busy')).toBe('false');
  });
});

import { describe, expect, it } from 'vitest';
import { initDeferredMountGroupSafely } from '~/core/runtime/deferred-mount-init';

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

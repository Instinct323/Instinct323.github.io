import { initDeferredMountGroupSafely } from '~/core/runtime/deferred-mount-init';
import { DEFERRED_MOUNT_CONFIGS } from '~/core/runtime/deferred-mount-config';

export function initDeferredMounts(): void {
  for (const config of Object.values(DEFERRED_MOUNT_CONFIGS)) {
    initDeferredMountGroupSafely(
      {
        containerSelector: config.containerSelector,
        configDataKey: config.configDataKey,
        mountGroup: config.mountGroup,
      },
      config.errorContext,
    );
  }
}

import type { DeferredMountConfig } from '../../types/site';

export const DEFERRED_MOUNT_CONFIGS: readonly DeferredMountConfig[] = Object.freeze([
  Object.freeze({
    containerSelector: '[data-gallery-lazy-config]',
    configDataKey: 'galleryLazyConfig',
    mountGroup: 'photography-gallery-image',
    errorContext: 'gallery',
  }),
]);

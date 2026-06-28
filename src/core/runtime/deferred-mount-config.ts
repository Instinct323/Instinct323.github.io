import type { DeferredMountConfig } from '~/features/site/types';

export const DEFERRED_MOUNT_CONFIGS: readonly DeferredMountConfig[] = Object.freeze([
  Object.freeze({
    containerSelector: '[data-gallery-lazy-config]',
    configDataKey: 'galleryLazyConfig',
    mountGroup: 'photography-gallery-image',
    errorContext: 'gallery',
  }),
]);

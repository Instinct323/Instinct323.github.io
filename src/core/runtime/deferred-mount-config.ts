import type { DeferredMountConfig } from '~/features/site/types';

/**
 * Frozen lookup of deferred mount configurations. Only the gallery group
 * is registered; additional groups can be added as key-value pairs.
 * Object.freeze prevents accidental mutation at runtime.
 */
export const DEFERRED_MOUNT_CONFIGS: Readonly<Record<string, DeferredMountConfig>> = Object.freeze({
  gallery: Object.freeze({
    containerSelector: '[data-gallery-lazy-config]',
    configDataKey: 'galleryLazyConfig',
    mountGroup: 'photography-gallery-image',
    errorContext: 'gallery',
  }),
});

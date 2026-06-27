import { bootstrapDeferredMounts } from '../../lib/runtime/deferred-mount-init';

export function initCarouselDeferredMounts(): void {
  try {
    bootstrapDeferredMounts({
      containerSelector: '.home-carousel[data-carousel-lazy-config]',
      configDataKey: 'carouselLazyConfig',
      mountGroup: 'home-carousel-image',
    });
  } catch (e) {
    console.error('Failed to initialize carousel deferred loading:', e);
  }
}

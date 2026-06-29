import { initCarouselDeferredMounts } from './deferred-mount';
import { initCarouselWithPrewarm } from './prewarm';

export function initFeaturedMediaCarousel(): void {
  initCarouselDeferredMounts();

  const carouselRoot = document.querySelector('.home-carousel');
  if (carouselRoot instanceof HTMLElement) {
    initCarouselWithPrewarm(carouselRoot);
  }
}

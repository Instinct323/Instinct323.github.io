import { runWhenIdle, CAROUSEL_PREWARM_TIMEOUT, CAROUSEL_PREWARM_FALLBACK } from './scheduling';

export function initCarouselWithPrewarm(carouselRoot: HTMLElement): void {
  // Keep one shared import promise so pointer/focus/viewport triggers never double-init.
  let initPromise: Promise<void> | null = null;
  let carouselModulePromise: Promise<typeof import('./carousel')> | null = null;

  const prewarmCarouselModule = () => {
    if (!carouselModulePromise) {
      carouselModulePromise = import('./carousel');
    }

    return carouselModulePromise;
  };

  const initCarousel = () => {
    if (!initPromise) {
      initPromise = prewarmCarouselModule()
        .then((mod) => {
          try {
            mod.registerFeaturedMediaCarouselReducedMotion();
            mod.initFeaturedMediaCarousels();
          } catch (error) {
            console.error('[carousel] Initialization failed:', error);
          }
        })
        .catch((error) => {
          console.error('[carousel] Module load failed:', error);
        });
    }

    return initPromise;
  };

  // Prewarm carousel module during idle time or early user intent.
  runWhenIdle(() => {
    void prewarmCarouselModule().catch((error) => {
      console.error('[carousel] Idle prewarm failed:', error);
    });
  }, {
    timeout: CAROUSEL_PREWARM_TIMEOUT,
    fallbackDelayMs: CAROUSEL_PREWARM_FALLBACK,
  });

  const prewarmOnIntent = () => {
    void prewarmCarouselModule().catch((error) => {
      console.error('[carousel] Intent prewarm failed:', error);
    });
  };

  carouselRoot.addEventListener('pointermove', prewarmOnIntent, { once: true, passive: true });
  carouselRoot.addEventListener('touchstart', prewarmOnIntent, { once: true, passive: true });

  // Intent-based eager load keeps controls responsive when users hover/focus before intersecting.
  const eagerLoad = () => {
    cleanup();
    void initCarousel();
  };

  const cleanup = () => {
    carouselRoot.removeEventListener('pointerenter', eagerLoad);
    carouselRoot.removeEventListener('focusin', eagerLoad);
  };

  carouselRoot.addEventListener('pointerenter', eagerLoad, { once: true, passive: true });
  carouselRoot.addEventListener('focusin', eagerLoad, { once: true });

  // Viewport-based lazy init remains the primary path, with idle-time preference on capable browsers.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();

      // Initialize immediately for faster response; idle-time preference removed.
      void initCarousel();
    }, { rootMargin: '100px 0px' });

    observer.observe(carouselRoot);
  } else {
    void initCarousel();
  }
}

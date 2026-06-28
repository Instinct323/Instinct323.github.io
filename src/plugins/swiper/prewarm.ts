import { runWhenIdle } from '~/core/runtime/scheduling';

const CAROUSEL_PREWARM_TIMEOUT = 1200;
const CAROUSEL_PREWARM_FALLBACK = 250;

/**
 * Initializes the carousel with a four-tier prewarm strategy, ranked by
 * urgency:
 * 1. idle-time prewarm (requestIdleCallback) — starts the module download
 *    when the browser is idle so the bundle is likely cached before interaction.
 * 2. intent-based prewarm (pointermove/touchstart) — warms when the user
 *    shows intent but before they commit to an interaction.
 * 3. eager load (pointerenter/focusin) — initializes immediately when the
 *    user hovers or focuses the carousel, keeping controls responsive.
 * 4. viewport-based lazy init (IntersectionObserver) — the fallback path
 *    when none of the above fire first; starts when the carousel is near
 *    the viewport so off-screen carousels do not consume resources.
 */
export function initCarouselWithPrewarm(carouselRoot: HTMLElement): void {
  let initPromise: Promise<void> | null = null;
  let carouselModulePromise: Promise<typeof import('./runtime')> | null = null;

  const prewarmCarouselModule = () => {
    if (!carouselModulePromise) {
      carouselModulePromise = import('./runtime');
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

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();

      void initCarousel();
    }, { rootMargin: '100px 0px' });

    observer.observe(carouselRoot);
  } else {
    void initCarousel();
  }
}

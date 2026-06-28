import type { HomePageCarouselVisualConfig } from '~/plugins/swiper/types';
import { clamp } from '~/core/utils/clamp';
import { assertFiniteNumber, assertObject } from '~/core/validation/assert';

/**
 * Validates and normalizes the carousel visual configuration.
 *
 * @throws When slideWidth breakpoints or spaceBetween are missing/invalid.
 */
export function resolveFeaturedCarouselVisual(visual: unknown): HomePageCarouselVisualConfig {
  const source = assertObject<Partial<HomePageCarouselVisualConfig>>(visual, 'carousel visual');

  const slideWidth = source.slideWidth;
  if (!slideWidth || typeof slideWidth !== 'object') {
    throw new Error('Missing carousel visual.slideWidth configuration');
  }

  const sw = slideWidth as Partial<HomePageCarouselVisualConfig['slideWidth']>;
  if (!sw.desktop || typeof sw.desktop !== 'string' || !sw.desktop.trim()) {
    throw new Error('Missing or invalid carousel visual.slideWidth.desktop');
  }
  if (!sw.tablet || typeof sw.tablet !== 'string' || !sw.tablet.trim()) {
    throw new Error('Missing or invalid carousel visual.slideWidth.tablet');
  }
  if (!sw.mobile || typeof sw.mobile !== 'string' || !sw.mobile.trim()) {
    throw new Error('Missing or invalid carousel visual.slideWidth.mobile');
  }

  const spaceBetween = assertFiniteNumber(source.spaceBetween, 'carousel visual.spaceBetween');
  if (spaceBetween < 0) {
    throw new Error('Missing or invalid carousel visual.spaceBetween (must be a non-negative number)');
  }

  const inactiveOpacityRaw = assertFiniteNumber(source.inactiveOpacity, 'carousel visual.inactiveOpacity');
  const inactiveOpacity = clamp(inactiveOpacityRaw, 0, 1);

  return {
    spaceBetween,
    slideWidth: {
      desktop: sw.desktop.trim(),
      tablet: sw.tablet.trim(),
      mobile: sw.mobile.trim(),
    },
    inactiveOpacity,
  };
}

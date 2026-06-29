import type { HomePageCarouselVisualConfig } from '~/plugins/swiper/types';
import { clamp } from '~/core/utils/clamp';
import { assertFiniteNumber, assertObject, assertString } from '~/core/validation/assert';

/**
 * Validates and normalizes the carousel visual configuration.
 */
export function resolveFeaturedCarouselVisual(visual: unknown): HomePageCarouselVisualConfig {
  const source = assertObject<Partial<HomePageCarouselVisualConfig>>(visual, 'carousel visual');

  const slideWidth = source.slideWidth;
  if (!slideWidth || typeof slideWidth !== 'object') {
    throw new Error('Missing carousel visual.slideWidth configuration');
  }

  const swRaw = slideWidth as Partial<HomePageCarouselVisualConfig['slideWidth']>;
  const sw: HomePageCarouselVisualConfig['slideWidth'] = {
    desktop: assertString(swRaw.desktop, 'carousel visual.slideWidth.desktop'),
    tablet: assertString(swRaw.tablet, 'carousel visual.slideWidth.tablet'),
    mobile: assertString(swRaw.mobile, 'carousel visual.slideWidth.mobile'),
  };

  const spaceBetween = assertFiniteNumber(source.spaceBetween, 'carousel visual.spaceBetween');
  if (spaceBetween < 0) {
    throw new Error('Missing or invalid carousel visual.spaceBetween (must be a non-negative number)');
  }

  const inactiveOpacityRaw = assertFiniteNumber(source.inactiveOpacity, 'carousel visual.inactiveOpacity');
  const inactiveOpacity = clamp(inactiveOpacityRaw, 0, 1);

  return {
    spaceBetween,
    slideWidth: sw,
    inactiveOpacity,
  };
}

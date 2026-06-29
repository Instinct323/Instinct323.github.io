import type { SiteImageConfig } from '~/features/site/image-config';
import {
  assertFiniteNumber,
  assertObject,
  assertPositiveIntegerArray,
  assertString,
} from '~/core/validation/assert';
import {
  IMAGE_LOADING_EFFECT_NAMES,
  type ImageLoadingEffectName,
} from '~/features/site/image-effects';

const IMAGE_LOADING_EFFECT_NAME_SET = new Set<string>(IMAGE_LOADING_EFFECT_NAMES);

function isImageLoadingEffectName(value: string): value is ImageLoadingEffectName {
  return IMAGE_LOADING_EFFECT_NAME_SET.has(value);
}

/**
 * @throws When rootMargin is missing/invalid.
 */
export function resolveImageLazyLoadConfig(config: unknown): SiteImageConfig['lazyLoad'] {
  const source = assertObject<Partial<SiteImageConfig['lazyLoad']>>(config, 'image.lazyLoad');
  if ((source as Record<string, unknown>).localDebugDelayMs !== undefined) {
    console.warn('localDebugDelayMs is no longer supported; the field is ignored. Use astro.config.mjs DEV_RESPONSE_DELAY_MS for dev-time observability.');
  }
  const rootMargin = assertString(source.rootMargin, 'image.lazyLoad.rootMargin');

  return {
    rootMargin,
  };
}

/**
 * @throws When the effect name is not in the registered set.
 */
export function resolveImagePlaceholderEffectConfig(config: unknown): SiteImageConfig['placeholderEffect'] {
  const effectName = assertString(config, 'image.placeholderEffect');

  if (!isImageLoadingEffectName(effectName)) {
    throw new Error(
      `Missing or invalid image.placeholderEffect (must be one of: ${IMAGE_LOADING_EFFECT_NAMES.join(', ')})`,
    );
  }

  return effectName;
}

/**
 * @throws When any required field is missing or out of range.
 */
export function resolveSiteImageConfig(config: unknown): SiteImageConfig {
  const source = assertObject<Partial<SiteImageConfig>>(config, 'image');
  const format = assertString(source.format, 'image.format');
  const quality = source.quality;

  if (typeof quality !== 'number' || !Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('Missing or invalid image.quality (must be an integer in [1, 100])');
  }

  const widths = source.widths;
  const widthConfig = assertObject<SiteImageConfig['widths']>(widths, 'image.widths');

  const dprScale = assertObject<SiteImageConfig['dprScale']>(source.dprScale, 'image.dprScale');

  const lowScale = assertFiniteNumber(dprScale.low, 'image.dprScale.low');
  const mediumScale = assertFiniteNumber(dprScale.medium, 'image.dprScale.medium');
  const highScale = assertFiniteNumber(dprScale.high, 'image.dprScale.high');
  if (lowScale <= 0 || mediumScale <= 0 || highScale <= 0) {
    throw new Error('Missing or invalid image.dprScale values (must be > 0)');
  }

  return {
    format,
    quality,
    widths: {
      medium: assertPositiveIntegerArray(widthConfig.medium, 'image.widths.medium'),
      high: assertPositiveIntegerArray(widthConfig.high, 'image.widths.high'),
    },
    dprScale: {
      low: lowScale,
      medium: mediumScale,
      high: highScale,
    },
    lazyLoad: resolveImageLazyLoadConfig(source.lazyLoad),
    placeholderEffect: resolveImagePlaceholderEffectConfig(source.placeholderEffect),
  };
}

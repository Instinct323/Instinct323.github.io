import type { SiteImageConfig } from '../../types/image-config';
import type {
  DeferredImageLazyLoadConfig,
  DeferredMountRuntimeConfig,
} from '../../types/page-load';
import {
  assertFiniteNumber,
  assertObject,
  assertPositiveIntegerArray,
  assertString,
} from '../utils/assertions';
import {
  IMAGE_LOADING_EFFECT_NAMES,
  type ImageLoadingEffectName,
} from '../../types/image-effects';

const IMAGE_LOADING_EFFECT_NAME_SET = new Set<string>(IMAGE_LOADING_EFFECT_NAMES);

function isImageLoadingEffectName(value: string): value is ImageLoadingEffectName {
  return IMAGE_LOADING_EFFECT_NAME_SET.has(value);
}

/**
 * Validates the lazy-load subset of image config.
 * Extracting this allows reuse by both the build-time image pipeline and
 * the runtime deferred mount bootstrap.
 *
 * @throws When rootMargin is missing/invalid or localDebugDelayMs is not a non-negative integer.
 */
export function resolveImageLazyLoadConfig(config: unknown): SiteImageConfig['lazyLoad'] {
  const source = assertObject<Partial<SiteImageConfig['lazyLoad']>>(config, 'image.lazyLoad');
  const rootMargin = assertString(source.rootMargin, 'image.lazyLoad.rootMargin');
  const localDebugDelayMs = assertFiniteNumber(
    source.localDebugDelayMs,
    'image.lazyLoad.localDebugDelayMs',
  );

  if (!Number.isInteger(localDebugDelayMs) || localDebugDelayMs < 0) {
    throw new Error('Missing or invalid image.lazyLoad.localDebugDelayMs (must be a non-negative integer)');
  }

  return {
    rootMargin,
    localDebugDelayMs,
  };
}

/**
 * Validates the placeholder effect name against the allowed set.
 * Restricting to known effects prevents runtime errors from typos
 * or unsupported effect names.
 *
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
 * Derives the runtime deferred mount config from lazy-load settings.
 * In development we add an artificial delay so developers can observe
 * the loading behavior; in production we mount immediately for speed.
 */
export function resolveDeferredMountRuntimeConfig(
  lazyLoad: DeferredImageLazyLoadConfig,
  isDev: boolean,
): Omit<DeferredMountRuntimeConfig, 'selector'> {
  return {
    rootMargin: lazyLoad.rootMargin,
    mountDelayMs: isDev ? lazyLoad.localDebugDelayMs : 0,
  };
}

/**
 * Validates and normalizes the full site image configuration object.
 * Centralizing validation ensures invalid config fails fast at build time
 * rather than producing broken images at runtime.
 *
 * @throws When any required field is missing or out of range.
 */
export function resolveSiteImageConfig(config: unknown): SiteImageConfig {
  const source = assertObject<Partial<SiteImageConfig>>(config, 'image');
  const format = assertString(source.format, 'image.format');
  const quality = assertFiniteNumber(source.quality, 'image.quality');

  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
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

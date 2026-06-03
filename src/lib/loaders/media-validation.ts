import { assertStrictlyIncreasingPositiveWidths, IMAGE_MEDIUM_WIDTHS_KEY, IMAGE_HIGH_WIDTHS_KEY, assertPositiveScale } from '../utils/image-width-utils';
import type {
  MediaConfig,
  HomePageImageConfig,
  HomePageCarouselConfig,
} from '../../types';
import { normalizeContentImagePath, resolveContentImageMetadata } from './media-loader-core';
import { calculateCarouselWidths } from './media-responsive';
import { createCachedLoader } from '../utils/cache';

export {
  assertStrictlyIncreasingPositiveWidths,
  IMAGE_MEDIUM_WIDTHS_KEY,
  IMAGE_HIGH_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '../utils/image-width-utils';

export type { CandidateWidthPolicyInput } from '../utils/image-width-utils';

export interface ValidatedHomepageGalleryConfig {
  featured: string[];
  image: HomePageImageConfig;
  carousel: HomePageCarouselConfig;
}

export function assertMediaConfigShape(config: MediaConfig): void {
  if (!config.grid?.columns || !config.image || !config.homepage?.carousel) {
    throw new Error('Invalid site config: missing media grid/image/carousel settings.');
  }

  assertStrictlyIncreasingPositiveWidths(config.image.widths?.medium, IMAGE_MEDIUM_WIDTHS_KEY);
  assertStrictlyIncreasingPositiveWidths(config.image.widths?.high, IMAGE_HIGH_WIDTHS_KEY);

  assertPositiveScale(config.image.dprScale?.low, 'image.dprScale.low');
  assertPositiveScale(config.image.dprScale?.medium, 'image.dprScale.medium');
  assertPositiveScale(config.image.dprScale?.high, 'image.dprScale.high');
}

function validateHomepageFeaturedPath(entry: unknown, index: number): string {
  if (typeof entry !== 'string' || !entry.trim()) {
    throw new Error(`Invalid homepage.featured[${index}]: expected a non-empty string path relative to content/photography/.`);
  }

  const rawPath = entry.trim();
  const normalizedPath = normalizeContentImagePath(`photography/${rawPath}`);

  if (!normalizedPath || !normalizedPath.startsWith('photography/')) {
    throw new Error(`Invalid homepage.featured[${index}]: "${rawPath}" is not a valid content/photography image path.`);
  }

  if (!resolveContentImageMetadata(normalizedPath)) {
    throw new Error(`Invalid homepage.featured[${index}]: "${rawPath}" does not resolve to an existing image under content/photography/.`);
  }

  return normalizedPath;
}

/**
 * Loads and validates the homepage gallery configuration.
 *
 * @param getMediaConfigCached - A cached loader for media configuration
 * @returns Promise resolving to validated homepage gallery config
 */
export async function getValidatedHomepageGalleryConfig(
  getMediaConfigCached: () => Promise<MediaConfig>
): Promise<ValidatedHomepageGalleryConfig> {
  const loadAndValidate = async (): Promise<ValidatedHomepageGalleryConfig> => {
    const mediaConfig = await getMediaConfigCached();
    const homepageConfig = mediaConfig.homepage;
    const featured = homepageConfig?.featured;
    const carousel = homepageConfig?.carousel;
    const globalImage = mediaConfig.image;

    if (!Array.isArray(featured)) {
      throw new Error('Invalid homepage.featured: expected an array of image paths relative to content/photography/.');
    }

    if (typeof globalImage?.format !== 'string' || !globalImage.format.trim()) {
      throw new Error('Invalid image.format: expected a non-empty string.');
    }

    if (typeof globalImage?.quality !== 'number' || !Number.isFinite(globalImage.quality) || globalImage.quality <= 0) {
      throw new Error('Invalid image.quality: expected a positive number.');
    }

    if (!carousel || typeof carousel !== 'object') {
      throw new Error('Invalid homepage.carousel: expected carousel settings.');
    }

    const homepageDprScale = assertPositiveScale(
      globalImage.dprScale.medium,
      'image.dprScale.medium',
    );

    const calculatedWidths = calculateCarouselWidths(
      carousel.visual.slideWidth,
      globalImage.widths.medium,
      homepageDprScale,
    );
    const widths = assertStrictlyIncreasingPositiveWidths(calculatedWidths, 'calculated carousel widths');
    const resolvedFeatured = featured.map((entry, index) => validateHomepageFeaturedPath(entry, index));

    if (resolvedFeatured.length < 3) {
      throw new Error(`Invalid homepage.featured: expected at least 3 valid images, received ${resolvedFeatured.length}.`);
    }

    return {
      featured: resolvedFeatured,
      image: {
        format: globalImage.format.trim(),
        quality: globalImage.quality,
        widths,
      },
      carousel,
    };
  };

  const cachedLoader = createCachedLoader(loadAndValidate);
  return cachedLoader();
}

import { assertStrictlyIncreasingPositiveWidths, IMAGE_MEDIUM_WIDTHS_KEY, selectCandidateWidthsByPolicy } from '~/core/media/sizing';
import { assertPositiveScale } from '~/core/validation/assert';
import type { MediaConfig } from '~/features/site/types';
import type { HomePageImageConfig } from '~/features/site/image-config';
import type { HomePageCarouselConfig } from '~/plugins/swiper/types';
import { normalizeContentImagePath } from '~/core/media/image';
import { computeCarouselInferredWidths } from '~/core/media/sizing';

export interface ValidatedHomepageGalleryConfig {
  featured: string[];
  image: HomePageImageConfig;
  carousel: HomePageCarouselConfig;
}

export function calculateCarouselWidths(
  slideWidth: HomePageCarouselConfig['visual']['slideWidth'],
  candidateWidths: number[],
  homepageDprScale: number,
): number[] {
  const inferredWidths = computeCarouselInferredWidths(slideWidth);

  return selectCandidateWidthsByPolicy({
    candidateWidths,
    inferredWidths,
    dprScale: homepageDprScale,
    key: IMAGE_MEDIUM_WIDTHS_KEY,
  });
}

/**
 * Retrieves the homepage gallery configuration with fail-fast validation.
 * Misconfiguration causes an immediate build failure rather than silent runtime breakage.
 */
export async function getValidatedHomepageGalleryConfig(
  getMediaConfigCached: () => Promise<MediaConfig>
): Promise<ValidatedHomepageGalleryConfig> {
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

  const resolvedFeatured = featured.map((entry, index) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new Error(`Invalid homepage.featured[${index}]: expected a non-empty string path relative to content/photography/.`);
    }

    const rawPath = entry.trim();
    const normalizedPath = normalizeContentImagePath(`photography/${rawPath}`);

    if (!normalizedPath || !normalizedPath.startsWith('photography/')) {
      throw new Error(`Invalid homepage.featured[${index}]: "${rawPath}" is not a valid content/photography image path.`);
    }

    return normalizedPath;
  });

  return {
    featured: resolvedFeatured,
    image: {
      format: globalImage.format.trim(),
      quality: globalImage.quality,
      widths,
    },
    carousel,
  };
}

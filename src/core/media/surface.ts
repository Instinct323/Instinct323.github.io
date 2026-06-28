import { loadMediaConfig } from '~/features/site/config-loader';
import { ABOUT_AVATAR_SIZES } from '~/core/content/paths';
import { createGridSizesString, MOBILE_BREAKPOINT } from '~/core/media/sizing';
import { createCachedLoader } from '~/core/utils/cache';
import { assertMediaConfigShape, getValidatedHomepageGalleryConfig } from './config';
import { computeGalleryWidthsFromGrid } from '~/core/media/sizing';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '~/core/media/sizing';
import type { MediaConfig } from '~/features/site/types';
import type { ContentImage, ContentImageOptions, FeaturedSlide, ImageLoader, MediaImage, MediaTree } from '~/core/media/types';
import { loadContentImageResolved, createImageVariantSet } from '~/core/media/image';
import { loadMediaTreeFromGallery } from '~/core/media/tree';

export const getMediaConfigCached = createCachedLoader(loadMediaConfig, {
  init: assertMediaConfigShape,
});

export const ABOUT_AVATAR_SIZES_STRING = `(max-width: ${MOBILE_BREAKPOINT}px) ${ABOUT_AVATAR_SIZES[0]}px, ${ABOUT_AVATAR_SIZES[1]}px`;
export const ABOUT_AVATAR_INFERRED_WIDTHS = [...ABOUT_AVATAR_SIZES];

export const HOME_COVERFLOW_MOBILE_BREAKPOINT = 767;
export const HOME_COVERFLOW_SIZES = `(max-width: ${HOME_COVERFLOW_MOBILE_BREAKPOINT}px) 480px, (max-width: 1024px) 640px, 768px`;

export interface SurfaceSizingProfile {
  inferredWidths: number[];
  sizes: string;
}

/** Chooses between the about-page avatar profile and the photography gallery profile based on the surface name. */
export function resolveMediumSurfaceProfile(
  mediaConfig: MediaConfig,
  surface: string,
): SurfaceSizingProfile {
  if (surface === 'about') {
    return {
      inferredWidths: ABOUT_AVATAR_INFERRED_WIDTHS,
      sizes: ABOUT_AVATAR_SIZES_STRING,
    };
  }

  return {
    inferredWidths: computeGalleryWidthsFromGrid(mediaConfig.grid),
    sizes: createGridSizesString(mediaConfig.grid),
  };
}

export async function loadContentImageWithConfigValidation(path: string, options: ContentImageOptions): Promise<ContentImage | null> {
  await getMediaConfigCached();
  return loadContentImageResolved(path, options);
}

/** Assembles responsive image options for a non-homepage surface by combining the surface profile with config-driven width policies. */
export function buildMediumSurfaceOptions(
  mediaConfig: MediaConfig,
  surface: string,
  common: Pick<ContentImageOptions, 'format' | 'quality'>,
): ContentImageOptions {
  const profile: SurfaceSizingProfile = resolveMediumSurfaceProfile(mediaConfig, surface);

  return {
    ...common,
    widths: selectCandidateWidthsByPolicy({
      candidateWidths: mediaConfig.image.widths.medium,
      inferredWidths: profile.inferredWidths,
      dprScale: mediaConfig.image.dprScale.medium,
      key: IMAGE_MEDIUM_WIDTHS_KEY,
    }),
    sizes: profile.sizes,
  };
}

export async function computeContentImageOptionsFromConfig(
  mediaConfig: MediaConfig,
  surface: string,
  overrides: Partial<ContentImageOptions>
): Promise<ContentImageOptions> {
  const globalImage = mediaConfig.image;
  const common = {
    format: globalImage.format,
    quality: globalImage.quality,
  };
  const homepageGalleryConfig = surface === 'home'
    ? await getValidatedHomepageGalleryConfig(getMediaConfigCached)
    : null;

  const base: ContentImageOptions = surface === 'home'
    ? {
        ...common,
        widths: homepageGalleryConfig?.image.widths,
        sizes: HOME_COVERFLOW_SIZES,
      }
    : buildMediumSurfaceOptions(mediaConfig, surface, common);

  return {
    alt: overrides.alt ?? base.alt,
    format: overrides.format ?? base.format,
    quality: overrides.quality ?? base.quality,
    widths: overrides.widths ?? base.widths,
    sizes: overrides.sizes ?? base.sizes,
    maxLongEdge: overrides.maxLongEdge ?? base.maxLongEdge,
  };
}

/** Derives responsive image options for a given surface, applying config defaults. */
export async function computeContentImageOptions(
  surface: string,
  overrides: Partial<ContentImageOptions>
): Promise<ContentImageOptions> {
  const mediaConfig = await getMediaConfigCached();
  return computeContentImageOptionsFromConfig(mediaConfig, surface, overrides);
}

export const imageLoader: ImageLoader = {
  async computeOptions(surface, overrides) {
    return computeContentImageOptions(surface, overrides);
  },
  async loadImage(path, options) {
    return loadContentImageWithConfigValidation(path, options);
  },
};

export async function createFeaturedSlide(image: ContentImage): Promise<FeaturedSlide> {
  const variantSet = await createImageVariantSet(image);

  return {
    src: variantSet.src,
    srcset: variantSet.srcset,
    sizes: image.responsive.sizes ?? HOME_COVERFLOW_SIZES,
    alt: image.alt,
    width: variantSet.width,
    height: variantSet.height,
    aspectRatio: image.aspectRatio,
    image,
  };
}

export async function loadFeaturedSlidesForHomepage(
  featuredPaths: string[],
  homeImageOptions: ContentImageOptions,
  loadContentImage: (_path: string, _options: ContentImageOptions) => Promise<ContentImage | null>
): Promise<FeaturedSlide[]> {
  const featuredImages = await Promise.all(featuredPaths.map(async (path) => {
    const image = await loadContentImage(path, homeImageOptions);

    if (!image) {
      throw new Error(`Invalid homepage.featured: failed to load validated image "${path}".`);
    }

    return image;
  }));

  return Promise.all(featuredImages.map((image) => createFeaturedSlide(image)));
}

/** Loads homepage featured slides with validated gallery config. */
export async function loadFeaturedSlides(): Promise<FeaturedSlide[]> {
  const homepageGalleryConfig = await getValidatedHomepageGalleryConfig(getMediaConfigCached);
  const homeImageOptions = await computeContentImageOptions('home', {});

  return loadFeaturedSlidesForHomepage(homepageGalleryConfig.featured, homeImageOptions, loadContentImageWithConfigValidation);
}

/** Maps a content image path to the MediaImage shape expected by the gallery tree builder. Returns null when the image cannot be resolved. */
function mapGalleryImage(path: string, options: ContentImageOptions): MediaImage | null {
  const imageAsset = loadContentImageResolved(path, options);

  if (!imageAsset) {
    if (import.meta.env.DEV) {
      console.error(`[mapGalleryImage] skipping gallery image (unresolved path): ${path}`);
      return null;
    }
    throw new Error(`[mapGalleryImage] gallery image unresolved: ${path}`);
  }

  return {
    path: imageAsset.path,
    alt: imageAsset.alt,
    width: imageAsset.width,
    height: imageAsset.height,
    aspectRatio: imageAsset.aspectRatio,
    responsive: imageAsset.responsive,
    src: imageAsset.source,
  };
}

/** Builds the full photography gallery tree with responsive image variants. */
export async function loadMediaTree(): Promise<MediaTree> {
  const mediaConfig = await getMediaConfigCached();
  const galleryImageOptions = await computeContentImageOptionsFromConfig(mediaConfig, 'photography', {});

  return loadMediaTreeFromGallery(mediaConfig.grid, galleryImageOptions, mapGalleryImage);
}

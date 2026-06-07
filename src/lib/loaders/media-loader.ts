import { loadMediaConfig } from './config-loader';
import { ABOUT_AVATAR_SIZES } from './content-paths';
import { createGridSizesString, MOBILE_BREAKPOINT } from '../utils/grid-width-utils';
import { createCachedLoader } from '../utils/cache';
import type {
  ContentImage,
  ContentImageOptions,
  FeaturedSlide,
  MediaConfig,
  MediaImage,
  MediaTree,
} from '../../types';
import { loadContentImageResolved, createImageVariantSet } from './media-loader-core';
import {
  computeGalleryWidthsFromGrid,
} from './media-responsive';
import {
  assertMediaConfigShape,
  getValidatedHomepageGalleryConfig,
} from './media-validation';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '../utils/image-width-utils';
import {
  loadMediaTreeFromGallery,
} from './media-tree';

const getMediaConfigCached = createCachedLoader(loadMediaConfig, {
  init: assertMediaConfigShape,
});

const ABOUT_AVATAR_SIZES_STRING = `(max-width: ${MOBILE_BREAKPOINT}px) ${ABOUT_AVATAR_SIZES[0]}px, ${ABOUT_AVATAR_SIZES[1]}px`;
const ABOUT_AVATAR_INFERRED_WIDTHS = [...ABOUT_AVATAR_SIZES];

export const HOME_COVERFLOW_MOBILE_BREAKPOINT = 767;
export const HOME_COVERFLOW_SIZES = `(max-width: ${HOME_COVERFLOW_MOBILE_BREAKPOINT}px) 480px, (max-width: 1024px) 640px, 768px`;

interface SurfaceSizingProfile {
  inferredWidths: number[];
  sizes: string;
}

function resolveMediumSurfaceProfile(
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

async function computeContentImageOptionsFromConfig(
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

function buildMediumSurfaceOptions(
  mediaConfig: MediaConfig,
  surface: string,
  common: Pick<ContentImageOptions, 'format' | 'quality'>,
): ContentImageOptions {
  const profile = resolveMediumSurfaceProfile(mediaConfig, surface);

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

/** Derives responsive image options for a given surface, applying config defaults. */
export async function computeContentImageOptions(
  surface: string,
  overrides: Partial<ContentImageOptions>
): Promise<ContentImageOptions> {
  const mediaConfig = await getMediaConfigCached();
  return computeContentImageOptionsFromConfig(mediaConfig, surface, overrides);
}

/** Resolves a content image through the cached media config pipeline. */
export async function loadContentImage(path: string, options: ContentImageOptions): Promise<ContentImage | null> {
  await getMediaConfigCached();
  return loadContentImageResolved(path, options);
}

/** Loads homepage featured slides with validated gallery config. */
export async function loadFeaturedSlides(): Promise<FeaturedSlide[]> {
  const homepageGalleryConfig = await getValidatedHomepageGalleryConfig(getMediaConfigCached);
  const homeImageOptions = await computeContentImageOptions('home', {});

  return loadFeaturedSlidesForHomepage(homepageGalleryConfig.featured, homeImageOptions, loadContentImage);
}

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

function mapGalleryImage(path: string, options: ContentImageOptions): MediaImage | null {
  const imageAsset = loadContentImageResolved(path, options);

  if (!imageAsset) {
    return null;
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

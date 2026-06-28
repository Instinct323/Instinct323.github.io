import { loadMediaConfig } from '~/features/site/config-loader';
import { ABOUT_AVATAR_SIZES } from '~/core/content/paths';
import { createGridSizesString, MOBILE_BREAKPOINT } from '~/core/media/sizing';
import { createCachedLoader } from '~/core/utils/cache';
import { assertMediaConfigShape } from './config';
import { computeGalleryWidthsFromGrid } from '~/core/media/sizing';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '~/core/media/sizing';
import type { MediaConfig } from '~/features/site/types';
import type { ContentImage, ContentImageOptions, ImageLoader } from '~/core/media/types';
import { loadContentImageResolved } from '~/core/media/image';
import { getValidatedHomepageGalleryConfig } from '~/features/home/gallery-config';

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

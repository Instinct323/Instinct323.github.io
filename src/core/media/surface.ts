import { ABOUT_AVATAR_SIZES } from '~/core/content/paths';
import { createGridSizesString, MOBILE_BREAKPOINT } from '~/core/media/sizing';
import { computeGalleryWidthsFromGrid } from '~/core/media/sizing';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '~/core/media/sizing';
import type { MediaConfig } from '~/features/site/types';
import type { ContentImageOptions } from '~/core/media/types';

export const ABOUT_AVATAR_SIZES_STRING = `(max-width: ${MOBILE_BREAKPOINT}px) ${ABOUT_AVATAR_SIZES[0]}px, ${ABOUT_AVATAR_SIZES[1]}px`;
const ABOUT_AVATAR_INFERRED_WIDTHS = [...ABOUT_AVATAR_SIZES];

export const HOME_COVERFLOW_SIZES = `(max-width: ${MOBILE_BREAKPOINT}px) 480px, (max-width: 1024px) 640px, 768px`;

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

/** Derives responsive image options for a given surface from an already-loaded MediaConfig. */
export function computeContentImageOptionsFromConfig(
  mediaConfig: MediaConfig,
  surface: string,
  overrides: Partial<ContentImageOptions>,
  homepageWidths?: readonly number[],
): ContentImageOptions {
  const globalImage = mediaConfig.image;
  const common = {
    format: globalImage.format,
    quality: globalImage.quality,
  };
  const base: ContentImageOptions = surface === 'home'
    ? {
        ...common,
        widths: homepageWidths ? [...homepageWidths] : undefined,
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

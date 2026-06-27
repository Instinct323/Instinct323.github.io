import { loadMediaConfig } from '../config-loader';
import { ABOUT_AVATAR_SIZES } from '../content-paths';
import { createGridSizesString, MOBILE_BREAKPOINT } from '../../utils/grid-width-utils';
import { createCachedLoader } from '../../utils/cache';
import { assertMediaConfigShape } from '../media-validation';
import { computeGalleryWidthsFromGrid } from '../media-responsive';
import type { MediaConfig } from '../../../types/site';
import type { ContentImage, ContentImageOptions, ImageLoader } from '../../../types/media';
import { loadContentImageResolved } from '../media-loader-core';
import { computeContentImageOptions } from './surface';

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

export const imageLoader: ImageLoader = {
  async computeOptions(surface, overrides) {
    return computeContentImageOptions(surface, overrides);
  },
  async loadImage(path, options) {
    return loadContentImageWithConfigValidation(path, options);
  },
};


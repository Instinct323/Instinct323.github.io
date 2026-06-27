import type { ContentImageOptions } from '../../../types/media';
import type { MediaConfig } from '../../../types/site';
import { getValidatedHomepageGalleryConfig } from '../media-validation';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '../../utils/image-width-utils';
import {
  getMediaConfigCached,
  HOME_COVERFLOW_SIZES,
  resolveMediumSurfaceProfile,
  type SurfaceSizingProfile,
} from './base';

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

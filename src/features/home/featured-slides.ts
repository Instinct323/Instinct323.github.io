import { createImageVariantSet, loadContentImageResolved } from '~/core/media/image';
import type { ContentImage, ContentImageOptions, FeaturedSlide } from '~/core/media/types';
import { HOME_COVERFLOW_SIZES, computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { getValidatedHomepageGalleryConfig } from '~/features/home/gallery-config';
import { loadMediaConfig } from '~/features/site/config-loader';

/**
 * Loads and renders a list of featured slides for the homepage coverflow
 * carousel. Each path is resolved through the injected `loadContentImage`
 * callback so callers (notably tests) can substitute a mock image loader,
 * then the resulting `ContentImage` is converted to its variant set
 * (src/srcset/sizes) for the coverflow rendering.
 *
 * The `loadContentImage` parameter is the dependency-injection seam used
 * by tests to swap in deterministic content images; production code passes
 * `loadContentImageResolved` from `~/core/media/image`.
 */
export async function loadFeaturedSlidesForHomepage(
  featuredPaths: string[],
  homeImageOptions: ContentImageOptions,
  loadContentImage: (_path: string, _options: ContentImageOptions) => ContentImage | null | Promise<ContentImage | null>,
): Promise<FeaturedSlide[]> {
  const featuredImages = await Promise.all(featuredPaths.map(async (path) => {
    const image = await loadContentImage(path, homeImageOptions);

    if (!image) {
      throw new Error(`Invalid homepage.featured: failed to load validated image "${path}".`);
    }

    return image;
  }));

  return Promise.all(featuredImages.map(async (image) => {
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
  }));
}

/**
 * Production entry point: loads MediaConfig once, validates the homepage
 * gallery config, computes home image options, and delegates to
 * `loadFeaturedSlidesForHomepage` with the standard image loader.
 */
export async function loadFeaturedSlides(): Promise<FeaturedSlide[]> {
  const mediaConfig = loadMediaConfig();
  const homepageGalleryConfig = getValidatedHomepageGalleryConfig(mediaConfig);
  const homeImageOptions = computeContentImageOptionsFromConfig(
    mediaConfig,
    'home',
    {},
    homepageGalleryConfig.image.widths,
  );

  return loadFeaturedSlidesForHomepage(
    homepageGalleryConfig.featured,
    homeImageOptions,
    loadContentImageResolved,
  );
}

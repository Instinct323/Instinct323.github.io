import { createImageVariantSet } from '~/core/media/image';
import type { ContentImage, ContentImageOptions, FeaturedSlide } from '~/core/media/types';
import { getMediaConfigCached, HOME_COVERFLOW_SIZES, computeContentImageOptions, loadContentImageWithConfigValidation } from '~/core/media/surface';
import { getValidatedHomepageGalleryConfig } from '~/features/home/gallery-config';

/**
 * Loads and renders a list of featured slides for the homepage coverflow
 * carousel. Each path is resolved through the injected `loadContentImage`
 * callback so callers (notably tests) can substitute a mock image loader,
 * then the resulting `ContentImage` is converted to its variant set
 * (src/srcset/sizes) for the coverflow rendering.
 *
 * The `loadContentImage` parameter is the dependency-injection seam used
 * by tests to swap in deterministic content images; production code passes
 * `loadContentImageWithConfigValidation` from `~/core/media/surface`.
 */
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
 * Production entry point: resolves the homepage gallery config, computes
 * the home image options, and delegates to `loadFeaturedSlidesForHomepage`
 * with the standard validated image loader.
 */
export async function loadFeaturedSlides(): Promise<FeaturedSlide[]> {
  const homepageGalleryConfig = await getValidatedHomepageGalleryConfig(getMediaConfigCached);
  const homeImageOptions = await computeContentImageOptions('home', {});

  return loadFeaturedSlidesForHomepage(homepageGalleryConfig.featured, homeImageOptions, loadContentImageWithConfigValidation);
}

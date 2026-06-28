import { createImageVariantSet } from '~/core/media/image';
import type { ContentImage, ContentImageOptions, FeaturedSlide } from '~/core/media/types';
import { getMediaConfigCached, HOME_COVERFLOW_SIZES, computeContentImageOptions, loadContentImageWithConfigValidation } from '~/core/media/surface';
import { getValidatedHomepageGalleryConfig } from '~/features/home/gallery-config';

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

export async function loadFeaturedSlides(): Promise<FeaturedSlide[]> {
  const homepageGalleryConfig = await getValidatedHomepageGalleryConfig(getMediaConfigCached);
  const homeImageOptions = await computeContentImageOptions('home', {});

  return loadFeaturedSlidesForHomepage(homepageGalleryConfig.featured, homeImageOptions, loadContentImageWithConfigValidation);
}

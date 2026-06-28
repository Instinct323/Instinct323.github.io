import { loadContentImageResolved } from '~/core/media/image';
import type { ContentImageOptions, MediaImage, MediaTree } from '~/core/media/types';
import { getMediaConfigCached, computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { loadMediaTreeFromGallery } from '~/core/media/tree';

/**
 * Maps a content image path to the MediaImage shape expected by the gallery tree builder.
 * Fail-fast: throws immediately when the image cannot be resolved, preventing silent gaps
 * in the gallery.
 */
function mapGalleryImage(path: string, options: ContentImageOptions): MediaImage {
  const imageAsset = loadContentImageResolved(path, options);

  if (!imageAsset) {
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

export async function loadMediaTree(): Promise<MediaTree> {
  const mediaConfig = await getMediaConfigCached();
  const galleryImageOptions = await computeContentImageOptionsFromConfig(mediaConfig, 'photography', {});

  return loadMediaTreeFromGallery(mediaConfig.grid, galleryImageOptions, mapGalleryImage);
}

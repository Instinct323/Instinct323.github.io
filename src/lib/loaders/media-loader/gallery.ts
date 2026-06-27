import type { ContentImageOptions, MediaImage, MediaTree } from '../../../types/media';
import { loadContentImageResolved } from '../media-loader-core';
import { loadMediaTreeFromGallery } from '../media-tree';
import { getMediaConfigCached } from './base';
import { computeContentImageOptionsFromConfig } from './surface';

/** Maps a content image path to the MediaImage shape expected by the gallery tree builder. Returns null when the image cannot be resolved. */
function mapGalleryImage(path: string, options: ContentImageOptions): MediaImage | null {
  const imageAsset = loadContentImageResolved(path, options);

  if (!imageAsset) {
    if (import.meta.env?.DEV) {
      console.warn(`[mapGalleryImage] skipping gallery image (unresolved path): ${path}`);
    }
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

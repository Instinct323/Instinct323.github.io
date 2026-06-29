import { loadContentImageResolved } from '~/core/media/image';
import type { MediaTree } from '~/core/media/types';
import { getMediaConfigCached, computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { loadMediaTreeFromGallery } from '~/core/media/tree';

export async function loadMediaTree(): Promise<MediaTree> {
  const mediaConfig = await getMediaConfigCached();
  const galleryImageOptions = await computeContentImageOptionsFromConfig(mediaConfig, 'photography', {});

  return loadMediaTreeFromGallery(mediaConfig.grid, galleryImageOptions, (path, options) => {
    const imageAsset = loadContentImageResolved(path, options);
    if (!imageAsset) {
      throw new Error(`gallery image unresolved: ${path}`);
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
  });
}

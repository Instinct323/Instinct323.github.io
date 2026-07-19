import { loadContentImageResolved } from '~/core/media/image';
import type { MediaTree } from '~/core/media/types';
import { computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { loadMediaTreeFromGallery } from '~/core/media/tree';
import type { MediaConfig } from '~/features/site/types';

export async function loadMediaTree(mediaConfig: MediaConfig): Promise<MediaTree> {
  const galleryImageOptions = computeContentImageOptionsFromConfig(mediaConfig, 'photography', {});

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

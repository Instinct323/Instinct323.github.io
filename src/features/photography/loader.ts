import { loadSiteConfig } from '~/features/site/config-cache';
import { assertObject } from '~/core/validation/assert';
import type { MediaTree } from '~/core/media/types';
import type { PhotographyPageConfig } from '~/features/photography/types';
import type { MediaConfig } from '~/features/site/types';
import { loadMediaTree } from '~/features/photography/media-tree';
import { loadMediaConfig } from '~/features/site/config-loader';

export async function loadPhotographyPage(): Promise<{
  mediaTree: Awaited<ReturnType<typeof loadMediaTree>>;
  photographyConfig: PhotographyPageConfig;
  mediaConfig: Awaited<ReturnType<typeof loadMediaConfig>>;
}> {
  const [mediaTree, mediaConfig] = await Promise.all([
    loadMediaTree(),
    loadMediaConfig(),
  ]);
  const photographyConfig: PhotographyPageConfig = {
    grid: assertObject<PhotographyPageConfig['grid']>(loadSiteConfig().photography.grid, 'photography.grid'),
  };

  return { mediaTree, photographyConfig, mediaConfig };
}

export interface PhotographyPageFrame {
  mediaTree: MediaTree;
  photographyConfig: PhotographyPageConfig;
  mediaConfig: MediaConfig;
}

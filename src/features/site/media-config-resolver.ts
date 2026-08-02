import { assertMediaConfigShape } from '~/core/media/config';
import { resolveFeaturedMediaConfig } from '~/features/home/config-resolver';
import { resolveSiteImageConfig } from './image-config-resolver';
import type { MediaConfig, SiteConfig } from './types';

export function resolveMediaConfig(config: SiteConfig): MediaConfig {
  const featuredMedia = resolveFeaturedMediaConfig(config.home.featuredMedia);
  const mediaConfig: MediaConfig = {
    grid: config.photography.grid,
    image: resolveSiteImageConfig(config.image),
    homepage: {
      featured: featuredMedia.items,
      carousel: featuredMedia.carousel,
    },
  };

  assertMediaConfigShape(mediaConfig);
  return mediaConfig;
}

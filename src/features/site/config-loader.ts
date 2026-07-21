import { loadSiteConfig } from './config-cache';
import { resolveFeaturedCarouselVisual } from '~/plugins/swiper/config-resolver';
import { resolveSiteImageConfig } from '~/features/site/image-config-resolver';
import { assertMediaConfigShape } from '~/core/media/config';
import { assertString } from '~/core/validation/assert';
import type { HomePageConfigGroup } from '~/features/home/types';
import type { MediaConfig, NavigationConfig, SiteConfig, SiteMetadata } from '~/features/site/types';

const MUSIC_VORBIS_MIME_TYPE = 'audio/ogg; codecs="vorbis"';

export interface MusicConfig {
  fileName: string;
  publicPath: string;
  mimeType: string;
}

/**
 * Builds the homepage featured media config by resolving the carousel visual.
 * Called from both `loadHomepageConfig` and `loadMediaConfig` to ensure both
 * views see the same resolved values.
 */
function buildFeaturedMediaConfig(featured: SiteConfig['home']['featuredMedia']): SiteConfig['home']['featuredMedia'] {
  return {
    items: featured.items,
    carousel: {
      ...featured.carousel,
      visual: resolveFeaturedCarouselVisual(featured.carousel.visual),
    },
  };
}

function getFeaturedMediaConfig(): SiteConfig['home']['featuredMedia'] {
  return buildFeaturedMediaConfig(loadSiteConfig().home.featuredMedia);
}

/** Extracts the navigation slice from the full site config. */
export function loadNavigationConfig(): NavigationConfig {
  return loadSiteConfig().navigation;
}

/** Builds the homepage view model by resolving featured media and carousel config. */
export function loadHomepageConfig(): HomePageConfigGroup {
  const { home } = loadSiteConfig();
  const featuredMedia = getFeaturedMediaConfig();

  return {
    hero: home.hero,
    layout: home.layout,
    editorialHero: home.editorialHero,
    featuredMedia,
  };
}

/** Aggregates image settings and homepage media into a single config object. */
export function loadMediaConfig(): MediaConfig {
  const config = loadSiteConfig();
  const featuredMedia = getFeaturedMediaConfig();

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

/** Extracts SEO metadata slice for layout injection. */
export function loadSiteMetadata(): SiteMetadata {
  return loadSiteConfig().metadata;
}

/** Validates and resolves the configured record-control music asset. */
export function loadMusicConfig(): MusicConfig {
  const music = loadSiteConfig().music;
  const fileName = assertString(music, 'music');

  if (music !== fileName) {
    throw new Error('Invalid music: filename must not have leading or trailing whitespace');
  }
  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Invalid music: filename must not contain path separators');
  }
  if (fileName.includes('..')) {
    throw new Error('Invalid music: filename must not contain traversal segments');
  }
  if (!fileName.endsWith('.ogg')) {
    throw new Error('Invalid music: filename must use the .ogg extension');
  }

  return {
    fileName,
    publicPath: `/music/${encodeURIComponent(fileName)}`,
    mimeType: MUSIC_VORBIS_MIME_TYPE,
  };
}

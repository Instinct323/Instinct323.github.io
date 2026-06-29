import { loadSiteConfig } from './config-cache';
import { resolveFeaturedCarouselVisual } from '~/plugins/swiper/config-resolver';
import { resolveSiteImageConfig } from '~/features/site/image-config-resolver';
import type { HomePageConfigGroup } from '~/features/home/types';
import type { MediaConfig, NavigationConfig, SiteConfig, SiteMetadata } from '~/features/site/types';

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
    featuredCarousel: featuredMedia.carousel,
  };
}

/** Aggregates image settings and homepage media into a single config object. */
export function loadMediaConfig(): MediaConfig {
  const config = loadSiteConfig();
  const featuredMedia = getFeaturedMediaConfig();

  return {
    grid: config.photography.grid,
    image: resolveSiteImageConfig(config.image),
    homepage: {
      featured: featuredMedia.items,
      carousel: featuredMedia.carousel,
    },
  };
}

/** Extracts SEO metadata slice for layout injection. */
export function loadSiteMetadata(): SiteMetadata {
  return loadSiteConfig().metadata;
}

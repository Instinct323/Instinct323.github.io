import { loadSiteConfig } from './config-cache';
import { resolveFeaturedCarouselVisual } from '~/plugins/swiper/config-resolver';
import { resolveSiteImageConfig } from '~/features/site/image-config-resolver';
import type { HomePageConfigGroup } from '~/features/home/types';
import type { MediaConfig, NavigationConfig, SiteConfig, SiteMetadata } from '~/features/site/types';

function buildFeaturedMediaConfig(featured: SiteConfig['home']['featuredMedia']): SiteConfig['home']['featuredMedia'] {
  return {
    items: featured.items,
    carousel: {
      ...featured.carousel,
      visual: resolveFeaturedCarouselVisual(featured.carousel.visual),
    },
  };
}

/** Extracts the navigation slice from the full site config. */
export function loadNavigationConfig(): NavigationConfig {
  return loadSiteConfig().navigation;
}

/** Builds the homepage view model by resolving featured media and carousel config. */
export function loadHomepageConfig(): HomePageConfigGroup {
  const { home } = loadSiteConfig();
  const featuredMedia = buildFeaturedMediaConfig(home.featuredMedia);

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
  const featuredMedia = buildFeaturedMediaConfig(config.home.featuredMedia);

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

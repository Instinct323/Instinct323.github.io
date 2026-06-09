import { loadSiteConfig } from './config-cache';
import { resolveFeaturedCarouselVisual } from '../domain/carousel-config';
import { resolveSiteImageConfig } from '../domain/image-config';
import type { HomePageConfigGroup } from '../../types/home';
import type { MediaConfig, NavigationConfig, SiteConfig, SiteMetadata } from '../../types/site';

export { loadSiteConfig, resetSiteConfig } from './config-cache';
export { loadProfile, loadIntroduction } from './profile-loader';
export { loadPhotography, loadEffectsConfig } from './photography-effects-loader';
function buildFeaturedMediaConfig(featured: SiteConfig['home']['featuredMedia']): SiteConfig['home']['featuredMedia'] {
  const carousel = featured.carousel;
  return {
    items: featured.items,
    carousel: {
      ...carousel,
      visual: resolveFeaturedCarouselVisual(carousel.visual),
    },
  };
}

/**
 * Extracts the navigation slice from the full site config.
 * Kept as a stable public API entry point to allow future changes to the
 * internal config structure without affecting callers that only need navigation.
 */
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
  const { siteUrl, defaultTitle, defaultDescription, keyword } = loadSiteConfig().metadata;
  return {
    siteUrl,
    defaultTitle,
    defaultDescription,
    keyword,
  };
}

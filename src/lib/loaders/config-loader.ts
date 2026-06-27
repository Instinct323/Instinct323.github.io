import { loadSiteConfig } from './config-cache';
import { resolveFeaturedCarouselVisual } from '../domain/carousel-config';
import { resolveSiteImageConfig } from '../domain/image-config';
import type { HomePageConfigGroup } from '../../types/home';
import type { MediaConfig, NavigationConfig, SiteConfig, SiteMetadata } from '../../types/site';

export { loadProfile } from './profile-loader';
const featuredMediaCache = new Map<SiteConfig['home']['featuredMedia'], SiteConfig['home']['featuredMedia']>();

function buildFeaturedMediaConfig(featured: SiteConfig['home']['featuredMedia']): SiteConfig['home']['featuredMedia'] {
  const cached = featuredMediaCache.get(featured);
  if (cached) return cached;

  const carousel = featured.carousel;
  const result = {
    items: featured.items,
    carousel: {
      ...carousel,
      visual: resolveFeaturedCarouselVisual(carousel.visual),
    },
  };
  featuredMediaCache.set(featured, result);
  return result;
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

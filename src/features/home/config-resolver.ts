import { resolveFeaturedCarouselVisual } from '~/plugins/swiper/config-resolver';
import type { HomePageConfig, HomePageFeaturedMediaConfig } from './home-config';

export function resolveFeaturedMediaConfig(
  featuredMedia: HomePageFeaturedMediaConfig,
): HomePageFeaturedMediaConfig {
  return {
    items: featuredMedia.items,
    carousel: {
      ...featuredMedia.carousel,
      visual: resolveFeaturedCarouselVisual(featuredMedia.carousel.visual),
    },
  };
}

export function resolveHomePageConfig(home: HomePageConfig): HomePageConfig {
  return {
    hero: home.hero,
    layout: home.layout,
    editorialHero: home.editorialHero,
    featuredMedia: resolveFeaturedMediaConfig(home.featuredMedia),
  };
}

// IMPORTANT: HomePageConfig is defined in ./home-config.ts to avoid circular dependency with ./site.ts

import type { HomePageCarouselConfig } from './carousel';
import type { ResolvedProfileData } from './profile';
import type { SiteConfig } from './site';
import type { HomePageConfig, HomePageHero } from './home-config';

export type { HomePageConfig, HomePageHero } from './home-config';

export type HomepageSectionKey = 'hero' | 'carousel';
export type HomepageHeroDeckField = 'location' | 'organization';
export type HomepageEditorialGapVariant = 'tight' | 'roomy';

export interface HomePageFeaturedMediaConfig {
  items: string[];
  carousel: HomePageCarouselConfig;
}

export interface HomePageConfigGroup {
  hero: HomePageConfig['hero'];
  layout: HomePageConfig['layout'];
  editorialHero: HomePageConfig['editorialHero'];
  featuredMedia: HomePageConfig['featuredMedia'];
  featuredCarousel: HomePageConfig['featuredMedia']['carousel'];
}

export interface HomePageData {
  profile: ResolvedProfileData;
  site: SiteConfig;
  home: HomePageHero;
}
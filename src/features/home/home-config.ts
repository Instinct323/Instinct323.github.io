// Separated from site.ts to avoid circular dependency.

import type { HomePageCarouselConfig } from '~/plugins/swiper/types';

export type HomepageSectionKey = 'hero' | 'carousel';
export type HomepageHeroDeckField = 'location' | 'organization';
export type HomepageEditorialGapVariant = 'tight' | 'roomy';

export interface HomePageHero {
  eyebrow: string;
}

export interface HomePageFeaturedMediaConfig {
  items: string[];
  carousel: HomePageCarouselConfig;
}

export interface HomePageConfig {
  hero: HomePageHero;
  layout: {
    contentWidth: 'compact' | 'standard' | 'wide';
    sectionOrder: HomepageSectionKey[];
    editorialGapVariant: HomepageEditorialGapVariant;
  };
  editorialHero: {
    deckFields: HomepageHeroDeckField[];
    showDeckDivider: boolean;
  };
  featuredMedia: HomePageFeaturedMediaConfig;
}
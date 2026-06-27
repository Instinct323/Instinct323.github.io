import type { ResolvedProfileData } from './profile';
import type { SiteConfig, SiteMetadata, SiteNavigation } from './site';
import type { HomePageConfig, HomePageHero } from './home-config';

export type {
  HomePageConfig,
  HomePageHero,
  HomepageSectionKey,
  HomepageHeroDeckField,
  HomepageEditorialGapVariant,
  HomePageFeaturedMediaConfig,
} from './home-config';

export interface HomePageSiteInfo {
  metadata: SiteMetadata;
  navigation: SiteNavigation;
  image: SiteConfig['image'];
  home: HomePageConfigGroup;
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
  site: HomePageSiteInfo;
  home: HomePageHero;
}
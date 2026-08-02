import type { ResolvedProfileData } from '~/features/about/types';
import type { SiteConfig, SiteMetadata, SiteNavigation } from '~/features/site/types';
import type { HomePageConfig, HomePageHero } from './home-config';

export type {
  HomePageConfig,
  HomePageHero,
} from './home-config';

export interface HomePageSiteInfo {
  metadata: SiteMetadata;
  navigation: SiteNavigation;
  image: SiteConfig['image'];
  home: HomePageConfigGroup;
}

export type HomePageConfigGroup = HomePageConfig;

export interface HomePageData {
  profile: ResolvedProfileData;
  site: HomePageSiteInfo;
  home: HomePageHero;
}

// IMPORTANT: Imports HomePageConfig from ./home-config.ts to avoid circular dependency with ./home.ts
import type { HomePageConfig } from './home-config';
import type { MediaGridConfig, SiteImageConfig } from './image-config';
import type { SiteEffectsConfig } from '../plugins/starfield';
import type { ResolvedProfileData } from './profile';
import type { ContentImage } from './media';

export interface SiteMetadata {
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  keyword?: string;
}

export interface SiteNavigation {
  order: string[];
}

export interface PhotographyPageConfig {
  grid: MediaGridConfig;
}

export interface SiteConfig {
  metadata: SiteMetadata;
  navigation: SiteNavigation;
  home: HomePageConfig;
  image: SiteImageConfig;
  photography: PhotographyPageConfig;
  effects: SiteEffectsConfig;
}

export type NavigationConfig = SiteConfig['navigation'];

export interface MediaConfig {
  grid: SiteConfig['photography']['grid'];
  image: SiteConfig['image'];
  homepage: {
    featured: SiteConfig['home']['featuredMedia']['items'];
    carousel: SiteConfig['home']['featuredMedia']['carousel'];
  };
}

export interface Publication {
  title: string;
  abstract?: string;
  authors: string[];
  date: string;
  source?: string;
  links?: Record<string, string>;
}

export interface AboutPageData {
  profile: ResolvedProfileData;
  introductionHtml: string;
  publications: Publication[];
  avatarImage: ContentImage;
}
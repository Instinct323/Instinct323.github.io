import type { SiteEffectsConfig } from './effects';
import type { HomePageConfig } from '~/features/home/home-config';
import type { SiteImageConfig } from '~/features/site/image-config';
import type { PhotographyPageConfig } from '~/features/photography/types';

export interface SiteMetadata {
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  keyword?: string;
}

export interface SiteNavRoute {
  key: string;
  href: string;
}

export interface SiteNavigation {
  order: string[];
  routes: Record<string, SiteNavRoute>;
}

export interface ShellTokenConfig {
  textStrong: string;
  textBody: string;
  textMuted: string;
}

export interface ShellsConfig {
  home: ShellTokenConfig;
  about: ShellTokenConfig;
  photography: ShellTokenConfig;
}

export interface DeferredMountConfig {
  containerSelector: string;
  configDataKey: string;
  mountGroup: string;
  errorContext: string;
}

export interface SiteConfig {
  metadata: SiteMetadata;
  navigation: SiteNavigation;
  music: string;
  home: HomePageConfig;
  image: Omit<SiteImageConfig, 'placeholderEffect'> & { placeholderEffect: string };
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


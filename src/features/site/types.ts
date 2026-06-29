import type { SiteEffectsConfig } from './effects';
import type { ResolvedProfileData } from '~/features/about/types';
import type { ContentImage } from '~/core/media/types';
import type { HomePageConfig } from '~/features/home/home-config';
import type { SiteImageConfig } from '~/features/site/image-config';

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

export interface PhotographyPageConfig {
  grid: {
    columns: { desktop: number; mobile: number };
    gap: string;
  };
}

export interface ShellTokenConfig {
  overlayAccentPrimary: string;
  overlayAccentSecondary: string;
  surfaceBg: string;
  cardSurfaceBg: string;
  surfaceBorder: string;
  pageCanvas: string;
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
  home: {
    hero: HomePageConfig['hero'];
    layout: HomePageConfig['layout'];
    editorialHero: HomePageConfig['editorialHero'];
    featuredMedia: {
      items: string[];
      carousel: {
        ariaLabel: string;
        prevButtonAriaLabel: string;
        nextButtonAriaLabel: string;
        emptyText: string;
        showNavigationArrows: boolean;
        showIndicator: boolean;
        counterPadLength: number;
        visual: {
          spaceBetween: number;
          slideWidth: { desktop: string; tablet: string; mobile: string };
          inactiveOpacity: number;
        };
      };
    };
  };
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

export interface Publication {
  title: string;
  abstract?: string;
  authors: string[];
  date: string;
  source?: string;
  links?: Record<string, string>;
  video?: string;
  weight?: number;
}

export interface AboutPageData {
  profile: ResolvedProfileData;
  introductionHtml: string;
  publications: Publication[];
  avatarImage: ContentImage;
}
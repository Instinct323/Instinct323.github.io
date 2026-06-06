import { introductionRaw, profile, siteConfigRaw } from './content-paths';
import { parse } from 'jsonc-parser';

import { resolveStarfieldEffectConfig } from '../../plugins/starfield';
import { resolveFeaturedCarouselVisual } from '../domain/carousel-config';
import { resolveSiteImageConfig } from '../domain/image-config';

import type {
  HomePageConfigGroup,
  MediaConfig,
  NavigationConfig,
  PhotographyPageConfig,
  ProfileData,
  SiteConfig,
  SiteMetadata,
} from '../../types';
import type { SiteEffectsConfig } from '../../plugins/starfield';

function resolvePhotographyConfig(config: SiteConfig['photography']): PhotographyPageConfig {
  const source = config as Partial<PhotographyPageConfig>;

  if (!source.grid || typeof source.grid !== 'object' || Array.isArray(source.grid)) {
    throw new Error('Missing or invalid photography.grid configuration object');
  }

  return {
    grid: source.grid,
  };
}

/**
 * Parses raw site configuration JSONC string into a typed SiteConfig object.
 *
 * @param raw - Raw JSONC string from site config file
 * @returns Parsed SiteConfig object
 * @throws Error if parsed config is not a valid object
 */
function parseSiteConfig(raw: string): SiteConfig {
  const parsed = parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid site config JSONC content');
  }

  return parsed as SiteConfig;
}

function buildFeaturedMediaConfig(featured: SiteConfig['home']['featuredMedia']): SiteConfig['home']['featuredMedia'] {
  const carousel = featured.carousel;

  return {
    items: featured.items,
    carousel: {
      ariaLabel: carousel.ariaLabel,
      prevButtonAriaLabel: carousel.prevButtonAriaLabel,
      nextButtonAriaLabel: carousel.nextButtonAriaLabel,
      emptyText: carousel.emptyText,
      showNavigationArrows: carousel.showNavigationArrows,
      showIndicator: carousel.showIndicator,
      counterPadLength: carousel.counterPadLength,
      visual: resolveFeaturedCarouselVisual(carousel.visual),
    },
  };
}

let siteConfig: SiteConfig | null = null;

function getSiteConfigInternal(): SiteConfig {
  if (!siteConfig) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

export function resetSiteConfig(): void {
  siteConfig = null;
}

function normalizeProfile(profileData: ProfileData): ProfileData {
  return {
    ...profileData,
    facts: profileData.facts.map((fact) => ({
      id: fact.id.trim(),
      value: fact.value.trim(),
    })),
  };
}

export function loadProfile(): ProfileData {
  return normalizeProfile(profile as ProfileData);
}

export function loadSiteConfig(): SiteConfig {
  return getSiteConfigInternal();
}

export function loadNavigationConfig(): NavigationConfig {
  return getSiteConfigInternal().navigation;
}

export function loadHomepageConfig(): HomePageConfigGroup {
  const { home } = getSiteConfigInternal();
  const featuredMedia = buildFeaturedMediaConfig(home.featuredMedia);

  return {
    hero: home.hero,
    layout: home.layout,
    editorialHero: home.editorialHero,
    featuredMedia,
    featuredCarousel: featuredMedia.carousel,
  };
}

export function loadMediaConfig(): MediaConfig {
  const config = getSiteConfigInternal();
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

export function loadIntroduction(): string {
  return introductionRaw;
}

export function loadPhotography(): PhotographyPageConfig {
  return resolvePhotographyConfig(getSiteConfigInternal().photography);
}

export function loadSiteMetadata(): SiteMetadata {
  const { siteUrl, defaultTitle, defaultDescription, keyword } = getSiteConfigInternal().metadata;

  return {
    siteUrl,
    defaultTitle,
    defaultDescription,
    keyword,
  };
}

export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = getSiteConfigInternal().effects;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) {
    throw new Error('Missing or invalid effects configuration');
  }

  return {
    starfield: resolveStarfieldEffectConfig((effects as Partial<SiteEffectsConfig>).starfield),
  };
}

import { loadSiteConfig } from './config-cache';
import { resolveMusicConfig } from '~/core/config/music';
import type { MusicConfig } from '~/core/config/music';
import { resolveHomePageConfig } from '~/features/home/config-resolver';
import { resolveMediaConfig } from './media-config-resolver';
import type { HomePageConfigGroup } from '~/features/home/types';
import type { MediaConfig, NavigationConfig, SiteMetadata } from '~/features/site/types';

export type { MusicConfig } from '~/core/config/music';

/** Extracts the navigation slice from the full site config. */
export function loadNavigationConfig(): NavigationConfig {
  return loadSiteConfig().navigation;
}

/** Builds the homepage view model by resolving featured media and carousel config. */
export function loadHomepageConfig(): HomePageConfigGroup {
  return resolveHomePageConfig(loadSiteConfig().home);
}

/** Aggregates image settings and homepage media into a single config object. */
export function loadMediaConfig(): MediaConfig {
  return resolveMediaConfig(loadSiteConfig());
}

/** Extracts SEO metadata slice for layout injection. */
export function loadSiteMetadata(): SiteMetadata {
  return loadSiteConfig().metadata;
}

/** Validates and resolves the configured record-control music asset. */
export function loadMusicConfig(): MusicConfig {
  return resolveMusicConfig(loadSiteConfig().music);
}

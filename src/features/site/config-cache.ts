import { siteConfigRaw } from '~/core/content/astro-adapter/config';
import { parseJsonc } from '~/core/utils/jsonc';
import { assertObject } from '~/core/validation/assert';
import type { SiteConfig } from '~/features/site/types';

/** Parses raw JSONC into a SiteConfig object, rejecting non-object values. */
function parseSiteConfig(raw: string): SiteConfig {
  const parsed = parseJsonc(raw);
  return assertObject<SiteConfig>(parsed, 'site config from config.jsonc');
}

/**
 * Module-level singleton cache for the parsed site config.
 *
 * Strategy: single-layer caching. `loadSiteConfig` stores the parsed object
 * here on first call and returns it on every subsequent call. During Vite HMR,
 * accepting updates to `content/config.jsonc` resets this cache so the next
 * call re-parses the fresh raw content.
 */
let siteConfig: SiteConfig | null = null;

if (import.meta.hot) {
  import.meta.hot.accept('/content/config.jsonc?raw', () => {
    siteConfig = null;
  });
}

export function loadSiteConfig(): SiteConfig {
  if (siteConfig === null) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

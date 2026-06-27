import { siteConfigRaw } from './astro-adapter/config';
import { parseJsonc } from '../utils/jsonc';
import { assertObject } from '../utils/assertions';
import type { SiteConfig } from '../../types/site';

/** Parses raw JSONC into a SiteConfig object, rejecting non-object values. */
function parseSiteConfig(raw: string): SiteConfig {
  const parsed = parseJsonc(raw);
  return assertObject<SiteConfig>(parsed, 'site config from config.jsonc');
}

// Module-level mutable state: caches parsed site config.
let siteConfig: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (siteConfig === null) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

import { siteConfigRaw } from './astro-adapter/config';
import { parseJsonc } from '../utils/jsonc';
import type { SiteConfig } from '../../types/site';

/** Parses raw JSONC into a SiteConfig object, rejecting non-object values. */
function parseSiteConfig(raw: string): SiteConfig {
  const parsed = parseJsonc(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Failed to parse site config from config.jsonc: invalid JSONC content');
  }

  return parsed as SiteConfig;
}

// Module-level mutable state: caches parsed site config. Reset via _resetSiteConfig() for tests.
let siteConfig: SiteConfig | null = null;

/** Allows tests to reset the cached site config between runs. */
function _resetSiteConfig(): void {
  siteConfig = null;
}

export function loadSiteConfig(): SiteConfig {
  if (!siteConfig) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

import { siteConfigRaw } from './astro-adapter';
import { parseJsonc } from '../utils/jsonc';
import type { SiteConfig } from '../../types/site';

/** Parses raw JSONC into a SiteConfig object, rejecting non-object values. */
export function parseSiteConfig(raw: string): SiteConfig {
  const parsed = parseJsonc(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Failed to parse site config from config.jsonc: invalid JSONC content');
  }

  return parsed as SiteConfig;
}

let siteConfig: SiteConfig | null = null;

/** Allows tests to reset the cached site config between runs. */
export function resetSiteConfig(): void {
  siteConfig = null;
}

export function loadSiteConfig(): SiteConfig {
  if (!siteConfig) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

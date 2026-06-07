import { siteConfigRaw } from './content-modules';
import { stripJsoncComments } from '../utils/jsonc';
import type { SiteConfig } from '../../types';

export function parseSiteConfig(raw: string): SiteConfig {
  const parsed = JSON.parse(stripJsoncComments(raw));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid site config JSONC content');
  }

  return parsed as SiteConfig;
}

/**
 * Module-level singleton that caches the parsed site configuration.
 *
 * This pattern uses a module-level `let` variable that is lazily initialized
 * on first access via `getSiteConfigInternal()`. The cache persists for the
 * lifetime of the module, avoiding repeated JSON parsing. Tests can reset the
 * cache via `resetSiteConfig()` to ensure isolation between test runs.
 */
let siteConfig: SiteConfig | null = null;

function getSiteConfigInternal(): SiteConfig {
  if (!siteConfig) {
    siteConfig = parseSiteConfig(siteConfigRaw);
  }
  return siteConfig;
}

/** Allows tests to reset the cached site config between runs. */
export function resetSiteConfig(): void {
  siteConfig = null;
}

/**
 * Central entry for site configuration; caches the parsed result to avoid re-parsing.
 * Kept as a stable public API entry point (loadSiteConfig) rather than exposing
 * the internal getter (getSiteConfigInternal) directly, so the caching semantics
 * and API shape remain consistent even if internal implementation changes.
 */
export function loadSiteConfig(): SiteConfig {
  return getSiteConfigInternal();
}

export { getSiteConfigInternal };

import { getSiteConfigInternal } from './config-cache';
import { resolveEffectsConfig } from '../domain/effects-resolver';
import type { PhotographyPageConfig, SiteConfig } from '../../types';
import type { SiteEffectsConfig } from '../../types/effects';

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
 * Validates and extracts photography page settings.
 * @throws Error if grid configuration is missing or invalid
 */
export function loadPhotography(): PhotographyPageConfig {
  return resolvePhotographyConfig(getSiteConfigInternal().photography);
}

/**
 * Resolves effect plugins from config and validates the configuration shape.
 * @throws Error if effects configuration is missing or invalid
 */
export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = getSiteConfigInternal().effects;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) {
    throw new Error('Missing or invalid effects configuration');
  }

  return {
    starfield: resolveEffectsConfig('starfield', (effects as Partial<SiteEffectsConfig>).starfield),
  };
}

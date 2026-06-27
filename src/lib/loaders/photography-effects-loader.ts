import { loadSiteConfig } from './config-cache';
import { getEffectsResolver } from '../domain/effects-resolver';
import type { StarfieldEffectConfig } from '../../plugins/starfield';
import type { PhotographyPageConfig, SiteConfig } from '../../types/site';
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

/** Validates and extracts photography page settings. */
export function loadPhotography(): PhotographyPageConfig {
  return resolvePhotographyConfig(loadSiteConfig().photography);
}

/** Resolves effect plugins from config and validates the configuration shape. */
export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = loadSiteConfig().effects;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) {
    throw new Error('Missing or invalid effects configuration');
  }

  const resolveStarfieldConfig = getEffectsResolver<StarfieldEffectConfig>('starfield');

  return {
    starfield: resolveStarfieldConfig((effects as Partial<SiteEffectsConfig>).starfield),
  };
}

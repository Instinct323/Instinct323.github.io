import { loadSiteConfig } from './config-cache';
import { resolveStarfieldEffectConfig } from '~/plugins/starfield';
import { assertObject } from '~/core/validation/assert';
import type { SiteEffectsConfig } from './effects';

export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = assertObject<SiteEffectsConfig>(loadSiteConfig().effects, 'effects');
  return {
    starfield: resolveStarfieldEffectConfig(effects.starfield),
  };
}

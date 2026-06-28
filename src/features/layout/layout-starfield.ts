import type { SiteEffectsConfig } from '~/features/site/effects';
import type { StarfieldEffectConfig } from '~/plugins/starfield';

export function resolveStarfieldConfig(effectsConfig: SiteEffectsConfig): StarfieldEffectConfig {
  return effectsConfig.starfield as StarfieldEffectConfig;
}

import { loadSiteConfig } from './config-cache';
import { getEffectsResolver } from '../domain/effects-resolver';
import type { StarfieldEffectConfig } from '../../plugins/starfield';
import type { PhotographyPageConfig, SiteConfig } from '../../types/site';
import type { SiteEffectsConfig } from '../../types/effects';
import { loadMediaTree } from './media-loader/gallery';
import { loadMediaConfig } from './config-loader';
import { registerPageLoader } from './page-loader-registry';

function resolvePhotographyConfig(config: SiteConfig['photography']): PhotographyPageConfig {
  const source = config as Partial<PhotographyPageConfig>;

  if (!source.grid || typeof source.grid !== 'object' || Array.isArray(source.grid)) {
    throw new Error('Missing or invalid photography.grid configuration object');
  }

  return {
    grid: source.grid,
  };
}

/** Validates and extracts photography page settings.
 * @deprecated Use `getPageLoader('photography').frame` instead.
 */
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

export async function loadPhotographyPage(): Promise<{
  mediaTree: Awaited<ReturnType<typeof loadMediaTree>>;
  photographyConfig: PhotographyPageConfig;
  mediaConfig: Awaited<ReturnType<typeof loadMediaConfig>>;
}> {
  const [mediaTree, photographyConfig, mediaConfig] = await Promise.all([
    loadMediaTree(),
    loadPhotography(),
    loadMediaConfig(),
  ]);

  return { mediaTree, photographyConfig, mediaConfig };
}

registerPageLoader('photography', { frame: loadPhotographyPage });

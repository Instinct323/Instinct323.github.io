import { loadSiteConfig } from './config-cache';
import { getEffectsResolver } from '../domain/effects-resolver';
import { assertObject } from '../utils/assertions';
import type { StarfieldEffectConfig } from '../../plugins/starfield';
import type { PhotographyPageConfig, SiteConfig } from '../../types/site';
import type { SiteEffectsConfig } from '../../types/effects';
import { loadMediaTree } from './media-loader/gallery';
import { loadMediaConfig } from './config-loader';
import { registerPageLoader } from './page-loader-registry';

function resolvePhotographyConfig(config: SiteConfig['photography']): PhotographyPageConfig {
  const source = config as Partial<PhotographyPageConfig>;

  return {
    grid: assertObject<PhotographyPageConfig['grid']>(source.grid, 'photography.grid'),
  };
}

/** Resolves effect plugins from config and validates the configuration shape. */
export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = assertObject<SiteEffectsConfig>(loadSiteConfig().effects, 'effects');

  const resolveStarfieldConfig = getEffectsResolver<StarfieldEffectConfig>('starfield');

  return {
    starfield: resolveStarfieldConfig(effects.starfield),
  };
}

export async function loadPhotographyPage(): Promise<{
  mediaTree: Awaited<ReturnType<typeof loadMediaTree>>;
  photographyConfig: PhotographyPageConfig;
  mediaConfig: Awaited<ReturnType<typeof loadMediaConfig>>;
}> {
  const [mediaTree, mediaConfig] = await Promise.all([
    loadMediaTree(),
    loadMediaConfig(),
  ]);
  const photographyConfig = resolvePhotographyConfig(loadSiteConfig().photography);

  return { mediaTree, photographyConfig, mediaConfig };
}

registerPageLoader('photography', { frame: loadPhotographyPage });

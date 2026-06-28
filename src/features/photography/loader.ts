import { loadSiteConfig } from '~/features/site/config-cache';
import { EFFECTS_RESOLVERS } from '~/features/site/effects';
import { assertObject } from '~/core/validation/assert';
import type { StarfieldEffectConfig } from '~/plugins/starfield';
import type { PhotographyPageConfig, SiteConfig } from '~/features/site/types';
import type { SiteEffectsConfig } from '~/features/site/effects';
import { loadMediaTree } from '~/features/photography/media-tree';
import { loadMediaConfig } from '~/features/site/config-loader';

function resolvePhotographyConfig(config: SiteConfig['photography']): PhotographyPageConfig {
  const source = config as Partial<PhotographyPageConfig>;

  return {
    grid: assertObject<PhotographyPageConfig['grid']>(source.grid, 'photography.grid'),
  };
}

/** Resolves effect plugins from config and validates the configuration shape. */
export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = assertObject<SiteEffectsConfig>(loadSiteConfig().effects, 'effects');

  const starfieldResolver = EFFECTS_RESOLVERS.starfield as (_config: unknown) => StarfieldEffectConfig;

  return {
    starfield: starfieldResolver(effects.starfield),
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

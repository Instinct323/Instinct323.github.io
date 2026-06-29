import { loadSiteConfig } from '~/features/site/config-cache';
import { EFFECTS_RESOLVERS } from '~/features/site/effects';
import { assertObject } from '~/core/validation/assert';
import type { StarfieldEffectConfig } from '~/plugins/starfield';
import type { MediaTree } from '~/core/media/types';
import type { PhotographyPageConfig, MediaConfig, SiteConfig } from '~/features/site/types';
import type { SiteEffectsConfig } from '~/features/site/effects';
import { loadMediaTree } from '~/features/photography/media-tree';
import { loadMediaConfig } from '~/features/site/config-loader';

function resolvePhotographyConfig(config: SiteConfig['photography']): PhotographyPageConfig {
  return {
    grid: assertObject<PhotographyPageConfig['grid']>(config.grid, 'photography.grid'),
  };
}

/** Resolves effect plugins from config and validates the configuration shape. */
export async function loadEffectsConfig(): Promise<SiteEffectsConfig> {
  const effects = assertObject<SiteEffectsConfig>(loadSiteConfig().effects, 'effects');

  return {
    starfield: EFFECTS_RESOLVERS.starfield(effects.starfield) as StarfieldEffectConfig,
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

export interface PhotographyPageFrame {
  mediaTree: MediaTree;
  photographyConfig: PhotographyPageConfig;
  mediaConfig: MediaConfig;
}

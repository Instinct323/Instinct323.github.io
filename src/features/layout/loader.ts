import { loadMediaConfig, loadSiteMetadata } from '~/features/site/config-loader';
import { loadEffectsConfig } from '~/features/site/effects-loader';

export interface LayoutFrameData {
  siteMetadata: Awaited<ReturnType<typeof loadSiteMetadata>>;
  mediaConfig: Awaited<ReturnType<typeof loadMediaConfig>>;
  effectsConfig: Awaited<ReturnType<typeof loadEffectsConfig>>;
}

export async function loadLayoutFrame(): Promise<LayoutFrameData> {
  const [siteMetadata, mediaConfig, effectsConfig] = await Promise.all([
    loadSiteMetadata(),
    loadMediaConfig(),
    loadEffectsConfig(),
  ]);

  return { siteMetadata, mediaConfig, effectsConfig };
}

import { loadMediaConfig, loadMusicConfig, loadSiteMetadata } from '~/features/site/config-loader';
import { loadEffectsConfig } from '~/features/site/effects-loader';

export interface LayoutFrameData {
  siteMetadata: Awaited<ReturnType<typeof loadSiteMetadata>>;
  mediaConfig: Awaited<ReturnType<typeof loadMediaConfig>>;
  musicConfig: Awaited<ReturnType<typeof loadMusicConfig>>;
  effectsConfig: Awaited<ReturnType<typeof loadEffectsConfig>>;
}

export async function loadLayoutFrame(): Promise<LayoutFrameData> {
  const [siteMetadata, mediaConfig, musicConfig, effectsConfig] = await Promise.all([
    loadSiteMetadata(),
    loadMediaConfig(),
    loadMusicConfig(),
    loadEffectsConfig(),
  ]);

  return { siteMetadata, mediaConfig, musicConfig, effectsConfig };
}

import { loadHomepageConfig } from '~/features/site/config-loader';
import { loadSiteConfig } from '~/features/site/config-cache';
import { loadProfile } from '~/features/about/profile/loader';
import { extractRequiredProfile } from '~/features/about/page-loader';
import type { HomePageData } from '~/features/home/types';

export async function loadHomePage(): Promise<HomePageData> {
  const [profileData, homepageConfig] = await Promise.all([
    loadProfile(),
    loadHomepageConfig(),
  ]);

  const site = loadSiteConfig();

  return {
    profile: extractRequiredProfile(profileData),
    site: {
      metadata: site.metadata,
      navigation: site.navigation,
      image: site.image,
      home: homepageConfig,
    },
    home: homepageConfig.hero,
  };
}

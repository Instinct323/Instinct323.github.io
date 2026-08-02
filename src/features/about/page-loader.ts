import { loadProfile } from '~/features/about/profile/loader';
import { introductionRaw } from '~/core/content/astro-adapter/config';
import type { AboutPageData } from '~/features/about/types';
import type { ContentImage } from '~/core/media/types';
import type { ResolvedProfileData } from '~/features/about/types';
import { computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { loadContentImageResolved } from '~/core/media/image';
import { renderMarkdown } from '~/core/content/markdown-renderer';
import { AVATAR_JPG, AVATAR_RELATIVE_PATH } from '~/core/content/paths';
import { extractRequiredProfile } from '~/core/profile';
import { loadMediaConfig } from '~/features/site/config-loader';
import type { MediaConfig } from '~/features/site/types';
import { loadPublications } from '~/features/about/publication/loader';

async function loadAboutPageFrame(): Promise<Omit<AboutPageData, 'avatarImage'>> {
  const profile = extractRequiredProfile(loadProfile());

  return {
    profile,
    introductionHtml: renderMarkdown(introductionRaw),
    publications: loadPublications(profile.name),
  };
}

export async function loadAboutPageFrameWithMedia(): Promise<Omit<AboutPageData, 'avatarImage'> & { mediaConfig: MediaConfig }> {
  const [aboutFrame, mediaConfig] = await Promise.all([
    loadAboutPageFrame(),
    loadMediaConfig(),
  ]);
  return { ...aboutFrame, mediaConfig };
}

export async function loadAboutAvatarImage(
  profileData: ResolvedProfileData,
  mediaConfig: MediaConfig,
): Promise<ContentImage> {
  const aboutImageOptions = computeContentImageOptionsFromConfig(mediaConfig, 'about', {
    alt: profileData.name,
  });
  const avatarImage = loadContentImageResolved(AVATAR_RELATIVE_PATH, aboutImageOptions);

  if (!avatarImage) {
    throw new Error(`Missing about avatar image: ${AVATAR_JPG}`);
  }

  return avatarImage;
}

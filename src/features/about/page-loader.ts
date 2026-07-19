import { loadProfile } from '~/features/about/profile/loader';
import { introductionRaw } from '~/core/content/astro-adapter/config';
import { compareByWeightAndDate } from '~/core/content/normalize';
import type { AboutPageData } from '~/features/about/types';
import type { Publication } from '~/features/about/publication/types';
import type { ContentImage } from '~/core/media/types';
import type { ResolvedProfileData } from '~/features/about/types';
import { computeContentImageOptionsFromConfig } from '~/core/media/surface';
import { loadContentImageResolved } from '~/core/media/image';
import { renderMarkdown } from '~/core/content/markdown-renderer';
import { normalizePublication } from '~/features/about/publication/utils';
import { AVATAR_JPG, AVATAR_RELATIVE_PATH } from '~/core/content/paths';
import { PUBLICATION_MODULES } from '~/core/content/astro-adapter/publications';
import { extractRequiredProfile } from '~/core/profile';
import { loadMediaConfig } from '~/features/site/config-loader';
import type { MediaConfig } from '~/features/site/types';

async function loadAboutPageFrame(): Promise<Omit<AboutPageData, 'avatarImage'>> {
  const [profileData, publications] = await Promise.all([
    loadProfile(),
    loadPublications(),
  ]);

  return {
    profile: extractRequiredProfile(profileData),
    introductionHtml: renderMarkdown(introductionRaw),
    publications,
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

/** Loads and sorts publications by author rank weight, then date, then title. */
async function loadPublications(): Promise<Publication[]> {
  const { name } = extractRequiredProfile(loadProfile());

  const rank = (p: Publication): number => {
    const i = p.authors.indexOf(name);
    return i >= 0 ? -i : Number.MIN_SAFE_INTEGER;
  };

  return Object.entries(PUBLICATION_MODULES)
    .map(([filePath, mod]) => normalizePublication(mod.default, filePath))
    .sort((a, b) =>
      compareByWeightAndDate(
        { weight: rank(a), date: a.date, slug: a.title },
        { weight: rank(b), date: b.date, slug: b.title }
      )
    );
}

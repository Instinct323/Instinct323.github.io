import { loadProfile } from '~/features/about/profile/loader';
import { introductionRaw } from '~/core/content/astro-adapter/config';
import { compareByWeightAndDate } from '~/core/content/normalize';
import type { AboutPageData } from '~/features/about/types';
import type { Publication } from '~/features/about/publication/types';
import type { ContentImage } from '~/core/media/types';
import type { ResolvedProfileData } from '~/features/about/types';
import { imageLoader } from '~/core/media/surface';
import { renderMarkdown } from '~/core/content/markdown';
import { normalizePublication } from '~/features/about/publication/utils';
import { AVATAR_JPG, AVATAR_RELATIVE_PATH } from '~/core/content/paths';
import { PUBLICATION_MODULES } from '~/core/content/astro-adapter/publications';
import { extractRequiredProfile } from '~/core/profile';
import { loadMediaConfig } from '~/features/site/config-loader';
import type { MediaConfig } from '~/features/site/types';

export async function loadAboutPageFrame(): Promise<Omit<AboutPageData, 'avatarImage'>> {
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

export async function loadAboutAvatarImage(profileData: ResolvedProfileData): Promise<ContentImage> {
  const aboutImageOptions = await imageLoader.computeOptions('about', {
    alt: profileData.name,
  });
  const avatarImage = await imageLoader.loadImage(AVATAR_RELATIVE_PATH, aboutImageOptions);

  if (!avatarImage) {
    throw new Error(`Missing about avatar image: ${AVATAR_JPG}`);
  }

  return avatarImage;
}

/** Loads and sorts publications by weight, then date, then title. */
export async function loadPublications(): Promise<Publication[]> {
  const publications = Object.entries(PUBLICATION_MODULES)
    .map(([filePath, mod]) => normalizePublication(mod.default, filePath));

  publications.sort((a, b) =>
    compareByWeightAndDate(
      { weight: a.weight ?? 0, date: a.date, slug: a.title },
      { weight: b.weight ?? 0, date: b.date, slug: b.title }
    )
  );

  return publications;
}

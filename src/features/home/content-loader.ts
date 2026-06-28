import { loadHomepageConfig } from '~/features/site/config-loader';
import { loadSiteConfig } from '~/features/site/config-cache';
import { loadProfile } from '~/features/about/profile/loader';
import { introductionRaw } from '~/core/content/astro-adapter/config';
import { assertString } from '~/core/validation/assert';
import { compareByWeightAndDate, trimProfileFacts } from '~/core/content/normalize';
import type { AboutPageData, Publication } from '~/features/site/types';
import type { ContentImage } from '~/core/media/types';
import type { HomePageData } from '~/features/home/types';
import type { ProfileData, ResolvedProfileData } from '~/features/about/types';
import { imageLoader } from '~/core/media/surface';
import { renderMarkdown } from '~/core/content/markdown';
import { normalizePublication } from '~/features/about/publication/utils';
import { AVATAR_JPG, AVATAR_RELATIVE_PATH } from '~/core/content/paths';
import { PUBLICATION_MODULES } from '~/core/content/astro-adapter/publications';
const REQUIRED_PROFILE_FACT_IDS = ['name', 'organization', 'location'] as const;

type RequiredProfileFactId = (typeof REQUIRED_PROFILE_FACT_IDS)[number];

function requireProfileFactValue(profileData: ProfileData, id: RequiredProfileFactId): string {
  const fact = profileData.facts.find((item) => item.id === id);
  if (!fact) {
    throw new Error(`Missing required profile fact: ${id}`);
  }

  return assertString(fact.value, id);
}

function extractRequiredProfile(profileData: ProfileData): ResolvedProfileData {
  const name = requireProfileFactValue(profileData, 'name');
  const organization = requireProfileFactValue(profileData, 'organization');
  const location = requireProfileFactValue(profileData, 'location');

  return {
    facts: trimProfileFacts(profileData.facts),
    email: profileData.email,
    website: profileData.website,
    links: profileData.links,
    name,
    organization,
    location,
  };
}

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

export async function loadAboutAvatarImage(profileData: ProfileData): Promise<ContentImage> {
  const aboutImageOptions = await imageLoader.computeOptions('about', {
    alt: requireProfileFactValue(profileData, 'name'),
  });
  const avatarImage = await imageLoader.loadImage(AVATAR_RELATIVE_PATH, aboutImageOptions);

  if (!avatarImage) {
    throw new Error(`Missing about avatar image: ${AVATAR_JPG}`);
  }

  return avatarImage;
}

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

/** Loads and sorts publications by weight, then date, then title. */
export async function loadPublications(): Promise<Publication[]> {
  const publications = Object.entries(PUBLICATION_MODULES)
    .map(([filePath, mod]) => normalizePublication(mod.default, filePath))
    .filter(Boolean);

  publications.sort((a, b) =>
    compareByWeightAndDate(
      { weight: a.weight ?? 0, date: a.date, slug: a.title },
      { weight: b.weight ?? 0, date: b.date, slug: b.title }
    )
  );

  return publications;
}


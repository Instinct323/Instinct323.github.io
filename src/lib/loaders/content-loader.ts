import { loadHomepageConfig } from './config-loader';
import { loadSiteConfig } from './config-cache';
import { loadProfile } from './profile-loader';
import { introductionRaw } from './astro-adapter';
import { compareNatural, compareByWeightAndDate, trimProfileFacts } from '../utils/content-normalize';
import type { AboutPageData, Publication } from '../../types/site';
import type { ContentImage } from '../../types/media';
import type { HomePageData } from '../../types/home';
import type { ProfileData, ResolvedProfileData } from '../../types/profile';
import { imageLoader } from './media-loader/base';
import { renderMarkdown } from '../utils/markdown';
import { normalizePublication } from '../domain/publication-utils';
import { AVATAR_JPG, AVATAR_RELATIVE_PATH } from './content-paths';
import { PUBLICATION_MODULES } from './astro-adapter';

const REQUIRED_PROFILE_FACT_IDS = ['name', 'organization', 'location'] as const;

type RequiredProfileFactId = (typeof REQUIRED_PROFILE_FACT_IDS)[number];

/** Fail-fast: required facts must exist and be non-empty. */
function requireProfileFactValue(profileData: ProfileData, id: RequiredProfileFactId): string {
  const fact = profileData.facts.find((item) => item.id === id);
  if (!fact) {
    throw new Error(`Missing required profile fact: ${id}`);
  }

  const value = fact.value.trim();
  if (!value) {
    throw new Error(`Profile fact \"${id}\" cannot be empty`);
  }

  return value;
}

function normalizeProfile(profileData: ProfileData): ResolvedProfileData {
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

/**
 * Loads the complete about page: profile, introduction, publications,
 * and avatar image. The avatar is loaded separately so the frame can
 * be rendered without waiting for the image asset.
 */
export async function loadAboutPage(): Promise<AboutPageData> {
  const frame = await loadAboutPageFrame();
  const avatarImage = await loadAboutAvatarImage(frame.profile);

  return {
    profile: frame.profile,
    introductionHtml: frame.introductionHtml,
    publications: frame.publications,
    avatarImage,
  };
}

/**
 * Loads the about page frame without the avatar image so the layout
 * can render while the avatar asset resolves in parallel.
 */
export async function loadAboutPageFrame(): Promise<Omit<AboutPageData, 'avatarImage'>> {
  const [profileData, publications] = await Promise.all([
    loadProfile(),
    loadPublications(),
  ]);
  const introduction = introductionRaw;

  return {
    profile: normalizeProfile(profileData),
    introductionHtml: renderMarkdown(introduction),
    publications,
  };
}

/** Resolves the about-page avatar image, using the profile name as alt text. */
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

/** Loads and sorts publications by natural file order, then by weight and date. */
export async function loadPublications(): Promise<Publication[]> {
  const publications = Object.entries(PUBLICATION_MODULES)
    .sort(([pathA], [pathB]) => compareNatural(pathA, pathB))
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

/** Loads homepage data by resolving profile and homepage config in parallel. */
export async function loadHomePage(): Promise<HomePageData> {
  const [profileData, homepageConfig] = await Promise.all([
    loadProfile(),
    loadHomepageConfig(),
  ]);

  const site = loadSiteConfig();

  return {
    profile: normalizeProfile(profileData),
    site: {
      metadata: site.metadata,
      navigation: site.navigation,
      image: site.image,
      home: homepageConfig,
    },
    home: homepageConfig.hero,
  };
}
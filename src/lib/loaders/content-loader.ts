import { loadHomepageConfig, loadSiteConfig } from './config-loader';
import { loadIntroduction, loadProfile } from './profile-loader';
import { compareNatural, compareByWeightAndDate, trimProfileFacts } from '../utils/content-normalize';
import type { AboutPageData, Publication } from '../../types/site';
import type { ContentImage } from '../../types/media';
import type { HomePageData } from '../../types/home';
import type { ProfileData, ResolvedProfileData } from '../../types/profile';
import {
  computeContentImageOptions,
  loadContentImageWithConfigValidation,
} from './media-loader';
import { renderMarkdown } from '../utils/markdown';
import { normalizePublication } from '../domain/publication-utils';
import { AVATAR_JPG } from './content-paths';
import { PUBLICATION_MODULES } from './astro-adapter';

const REQUIRED_PROFILE_FACT_IDS = ['name', 'organization', 'location'] as const;

type RequiredProfileFactId = (typeof REQUIRED_PROFILE_FACT_IDS)[number];

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

function normalizeProfileForHome(profileData: ProfileData): ResolvedProfileData {
  const name = requireProfileFactValue(profileData, 'name');
  const organization = requireProfileFactValue(profileData, 'organization');
  const location = requireProfileFactValue(profileData, 'location');

  return {
    facts: trimProfileFacts(profileData.facts),
    email: profileData.email,
    website: profileData.website,
    social: profileData.social,
    name,
    organization,
    location,
  };
}

function resolveAvatarAltFromProfile(profileData: ProfileData): string {
  return requireProfileFactValue(profileData, 'name');
}

/** Composes the full about page by combining frame data with the avatar image. */
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

/** Loads about page core data in parallel to minimize async overhead. */
export async function loadAboutPageFrame(): Promise<Omit<AboutPageData, 'avatarImage'>> {
  const [profileData, introduction, publications] = await Promise.all([
    loadProfile(),
    loadIntroduction(),
    loadPublications(),
  ]);

  return {
    profile: normalizeProfileForHome(profileData),
    introductionHtml: renderMarkdown(introduction),
    publications,
  };
}

/**
 * Resolves the avatar image with alt text derived from the profile name.
 * @throws Error if the avatar image is missing
 */
export async function loadAboutAvatarImage(profileData: ProfileData): Promise<ContentImage> {
  const aboutImageOptions = await computeContentImageOptions('about', {
    alt: resolveAvatarAltFromProfile(profileData),
  });
  const avatarImage = await loadContentImageWithConfigValidation(AVATAR_JPG.replace('../../content/', ''), aboutImageOptions);

  if (!avatarImage) {
    throw new Error(`Missing about avatar image: ${AVATAR_JPG}`);
  }

  return avatarImage;
}

/** Loads, normalizes, and sorts all publication entries by weight and date. */
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

/** Composes homepage data by merging profile and site configuration. */
export async function loadHomePage(): Promise<HomePageData> {
  const [profileData, homepageConfig] = await Promise.all([
    loadProfile(),
    loadHomepageConfig(),
  ]);

  const site = loadSiteConfig();

  return {
    profile: normalizeProfileForHome(profileData),
    site,
    home: homepageConfig.hero,
  };
}
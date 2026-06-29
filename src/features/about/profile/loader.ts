import { profile } from '~/core/content/astro-adapter/config';
import { trimProfileFacts } from '~/core/content/normalize';
import type { ProfileData } from '~/features/about/types';

function normalizeProfile(profileData: ProfileData): ProfileData {
  return {
    ...profileData,
    facts: trimProfileFacts(profileData.facts),
  };
}

/** Normalizes raw profile data before consumption. */
export function loadProfile(): ProfileData {
  return normalizeProfile(profile as ProfileData);
}

import { introductionRaw, profile } from './content-modules';
import { trimProfileFacts } from '../utils/content-normalize';
import type { ProfileData } from '../../types';

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

/**
 * Provides raw introduction text for markdown rendering.
 * Kept as a stable public API entry point even though it currently returns
 * a raw constant, so that future content sources (e.g., database, CMS) can
 * be swapped in without changing caller code.
 */
export function loadIntroduction(): string {
  return introductionRaw;
}

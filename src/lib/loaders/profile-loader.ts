import { profile } from './astro-adapter/config';
import { trimProfileFacts } from '../utils/content-normalize';
import type { ProfileData } from '../../types/profile';

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



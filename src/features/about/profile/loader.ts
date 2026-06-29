import { profile } from '~/core/content/astro-adapter/config';
import { trimProfileFacts } from '~/core/content/normalize';
import type { ProfileData } from '~/features/about/types';

/** Normalizes raw profile data before consumption. */
export function loadProfile(): ProfileData {
  const data = profile as ProfileData;
  return { ...data, facts: trimProfileFacts(data.facts) };
}

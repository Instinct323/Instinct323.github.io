import type { ProfileData, ResolvedProfileData } from '~/features/about/types';
import { assertString } from '~/core/validation/assert';
import { trimProfileFacts } from '~/core/content/normalize';

function requireProfileFactValue(profileData: ProfileData, id: 'name' | 'organization' | 'location'): string {
  const fact = profileData.facts.find((item) => item.id === id);
  if (!fact) {
    throw new Error(`Missing required profile fact: ${id}`);
  }

  return assertString(fact.value, id);
}

export function extractRequiredProfile(profileData: ProfileData): ResolvedProfileData {
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

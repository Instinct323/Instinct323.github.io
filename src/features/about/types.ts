import type { ProfileFact } from '~/core/content/normalize';
import type { ContentImage } from '~/core/media/types';
import type { Publication } from './publication/types';

export interface ProfileLink {
  key: string;
  value: string;
}

export interface ProfileData {
  facts: ProfileFact[];
  email?: string;
  website?: string;
  links?: ProfileLink[];
}

export interface ResolvedProfileData extends ProfileData {
  name: string;
  location: string;
  organization: string;
}

export interface AboutPageData {
  profile: ResolvedProfileData;
  introductionHtml: string;
  publications: Publication[];
  avatarImage: ContentImage;
}

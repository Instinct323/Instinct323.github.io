export interface ProfileFact {
  id: string;
  value: string;
}

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

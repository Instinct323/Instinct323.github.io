import { describe, expect, it } from 'vitest';
import { getPageLoader } from '~/features/site/load';

import '~/features/home/content-loader';
import type { HomePageData } from '~/features/home/types';
import type { AboutPageData } from '~/features/about/types';

describe('content-loader', () => {
  describe('home page loader', () => {
    it('returns home page data with profile, site, and hero', async () => {
      const home = (await getPageLoader('home').frame()) as HomePageData;
      expect(typeof home.profile.name).toBe('string');
      expect(typeof home.profile.organization).toBe('string');
      expect(typeof home.profile.location).toBe('string');
      expect(typeof home.site).toBe('object');
      expect(typeof home.home.eyebrow).toBe('string');
    });
  });

  describe('about page loader', () => {
    it('returns about page frame with profile, introduction, and publications', async () => {
      const frame = (await getPageLoader('about').frame()) as Omit<AboutPageData, 'avatarImage'>;
      expect(typeof frame.profile.name).toBe('string');
      expect(typeof frame.profile.organization).toBe('string');
      expect(typeof frame.profile.location).toBe('string');
      expect(typeof frame.introductionHtml).toBe('string');
      expect(Array.isArray(frame.publications)).toBe(true);
      expect(Array.isArray(frame.profile.links)).toBe(true);
      expect(frame.profile.links!.length).toBeGreaterThan(0);
    });
  });
});

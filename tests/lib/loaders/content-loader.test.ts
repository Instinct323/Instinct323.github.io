import { describe, expect, it } from 'vitest';
import { getPageLoader } from '../../../src/lib/loaders/page-loader-registry';

import '../../../src/lib/loaders/content-loader';
import type { HomePageData } from '../../../src/types/home';
import type { AboutPageData } from '../../../src/types/site';

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

import { describe, expect, it } from 'vitest';
import { loadAboutPageFrame, loadHomePage } from '../../../src/lib/loaders/content-loader';

describe('content-loader', () => {
  describe('loadHomePage', () => {
    it('returns home page data with profile, site, and hero', async () => {
      const home = await loadHomePage();
      expect(typeof home.profile.name).toBe('string');
      expect(typeof home.profile.organization).toBe('string');
      expect(typeof home.profile.location).toBe('string');
      expect(typeof home.site).toBe('object');
      expect(typeof home.home.eyebrow).toBe('string');
    });
  });

  describe('loadAboutPageFrame', () => {
    it('returns about page frame with profile, introduction, and publications', async () => {
      const frame = await loadAboutPageFrame();
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

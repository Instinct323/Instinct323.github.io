import { describe, expect, it } from 'vitest';
import { loadAboutPageFrame, loadHomePage } from '../../../src/lib/loaders/content-loader';

describe('content-loader', () => {
  describe('loadHomePage', () => {
    it('returns home page data with profile, site, and hero', async () => {
      const home = await loadHomePage();
      expect(home).toBeDefined();
      expect(home.profile).toBeDefined();
      expect(home.profile.name).toBeDefined();
      expect(home.profile.organization).toBeDefined();
      expect(home.profile.location).toBeDefined();
      expect(home.site).toBeDefined();
      expect(home.home).toBeDefined();
      expect(home.home.eyebrow).toBeDefined();
    });
  });

  describe('loadAboutPageFrame', () => {
    it('returns about page frame with profile, introduction, and publications', async () => {
      const frame = await loadAboutPageFrame();
      expect(frame).toBeDefined();
      expect(frame.profile).toBeDefined();
      expect(frame.profile.name).toBeDefined();
      expect(frame.profile.organization).toBeDefined();
      expect(frame.profile.location).toBeDefined();
      expect(frame.introductionHtml).toBeDefined();
      expect(typeof frame.introductionHtml).toBe('string');
      expect(frame.publications).toBeDefined();
      expect(Array.isArray(frame.publications)).toBe(true);
    });
  });
});

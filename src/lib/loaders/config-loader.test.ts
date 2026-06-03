import { describe, expect, it } from 'vitest';
import {
  loadEffectsConfig,
  loadHomepageConfig,
  loadMediaConfig,
  loadNavigationConfig,
  loadPhotography,
  loadSiteConfig,
  loadSiteMetadata,
  resetSiteConfig,
} from './config-loader';

describe('config-loader lazy singleton', () => {
  it('loadSiteConfig returns the same object on repeated calls (caching)', () => {
    const first = loadSiteConfig();
    const second = loadSiteConfig();
    expect(second).toBe(first);
  });

  it('resetSiteConfig causes next call to re-parse', () => {
    const before = loadSiteConfig();
    resetSiteConfig();
    const after = loadSiteConfig();
    expect(after).not.toBe(before);
    expect(after).toEqual(before);
  });

  it('loadNavigationConfig returns navigation from config', () => {
    const nav = loadNavigationConfig();
    expect(nav).toBeDefined();
    expect(Array.isArray(nav.order)).toBe(true);
    expect(nav.order.length).toBeGreaterThan(0);
  });

  it('loadHomepageConfig returns homepage config group', () => {
    const home = loadHomepageConfig();
    expect(home).toBeDefined();
    expect(home.hero).toBeDefined();
    expect(home.layout).toBeDefined();
    expect(home.featuredMedia).toBeDefined();
    expect(home.featuredCarousel).toBeDefined();
  });

  it('loadMediaConfig returns media config', () => {
    const media = loadMediaConfig();
    expect(media).toBeDefined();
    expect(media.grid).toBeDefined();
    expect(media.image).toBeDefined();
    expect(media.homepage).toBeDefined();
  });

  it('loadPhotography returns photography page config', () => {
    const photo = loadPhotography();
    expect(photo).toBeDefined();
    expect(photo.grid).toBeDefined();
  });

  it('loadSiteMetadata returns metadata', () => {
    const meta = loadSiteMetadata();
    expect(meta).toBeDefined();
    expect(meta.siteUrl).toBeDefined();
    expect(meta.defaultTitle).toBeDefined();
    expect(meta.defaultDescription).toBeDefined();
  });

  it('loadEffectsConfig returns effects config', async () => {
    const effects = await loadEffectsConfig();
    expect(effects).toBeDefined();
    expect(effects.starfield).toBeDefined();
  });
});

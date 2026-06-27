import { describe, expect, it } from 'vitest';
import '../../../src/plugins/starfield'; // registers starfield effect resolver for loadEffectsConfig
import {
  loadHomepageConfig,
  loadMediaConfig,
  loadNavigationConfig,
  loadSiteMetadata,
} from '../../../src/lib/loaders/config-loader';
import { loadSiteConfig } from '../../../src/lib/loaders/config-cache';
import { loadPhotographyPage, loadEffectsConfig } from '../../../src/lib/loaders/photography-effects-loader';

describe('config-loader lazy singleton', () => {
  it('loadSiteConfig returns the same object on repeated calls (caching)', () => {
    const first = loadSiteConfig();
    const second = loadSiteConfig();
    expect(second).toBe(first);
  });

  it('loadSiteConfig returns correct shape', () => {
    const config = loadSiteConfig();
    expect(config).toHaveProperty('metadata');
    expect(config).toHaveProperty('navigation');
    expect(config).toHaveProperty('home');
    expect(config).toHaveProperty('image');
    expect(config).toHaveProperty('photography');
    expect(config).toHaveProperty('effects');
    expect(typeof config.metadata).toBe('object');
    expect(typeof config.navigation).toBe('object');
    expect(typeof config.home).toBe('object');
    expect(typeof config.image).toBe('object');
    expect(typeof config.photography).toBe('object');
    expect(typeof config.effects).toBe('object');
  });

  it('loadNavigationConfig returns navigation from config', () => {
    const nav = loadNavigationConfig();
    expect(nav).toBeDefined();
    expect(Array.isArray(nav.order)).toBe(true);
    expect(nav.order.length).toBeGreaterThan(0);
  });

  it('loadHomepageConfig returns homepage config group with expected structure', () => {
    const home = loadHomepageConfig();
    expect(home).toBeDefined();
    expect(home.hero).toBeDefined();
    expect(typeof home.hero.eyebrow).toBe('string');
    expect(home.layout).toBeDefined();
    expect(typeof home.layout.contentWidth).toBe('string');
    expect(Array.isArray(home.layout.sectionOrder)).toBe(true);
    expect(home.editorialHero).toBeDefined();
    expect(Array.isArray(home.editorialHero.deckFields)).toBe(true);
    expect(typeof home.editorialHero.showDeckDivider).toBe('boolean');
    expect(home.featuredMedia).toBeDefined();
    expect(Array.isArray(home.featuredMedia.items)).toBe(true);
    expect(home.featuredCarousel).toBeDefined();
    expect(typeof home.featuredCarousel.ariaLabel).toBe('string');
    expect(typeof home.featuredCarousel.prevButtonAriaLabel).toBe('string');
    expect(typeof home.featuredCarousel.nextButtonAriaLabel).toBe('string');
    expect(typeof home.featuredCarousel.emptyText).toBe('string');
    expect(typeof home.featuredCarousel.showNavigationArrows).toBe('boolean');
    expect(typeof home.featuredCarousel.showIndicator).toBe('boolean');
    expect(typeof home.featuredCarousel.counterPadLength).toBe('number');
    expect(home.featuredCarousel.visual).toBeDefined();
    expect(typeof home.featuredCarousel.visual.spaceBetween).toBe('number');
    expect(home.featuredCarousel.visual.slideWidth).toBeDefined();
    expect(typeof home.featuredCarousel.visual.slideWidth.desktop).toBe('string');
    expect(typeof home.featuredCarousel.visual.slideWidth.tablet).toBe('string');
    expect(typeof home.featuredCarousel.visual.slideWidth.mobile).toBe('string');
    expect(typeof home.featuredCarousel.visual.inactiveOpacity).toBe('number');
  });

  it('loadMediaConfig returns media config with expected structure', () => {
    const media = loadMediaConfig();
    expect(media).toBeDefined();
    expect(media.grid).toBeDefined();
    expect(typeof media.grid.columns.desktop).toBe('number');
    expect(typeof media.grid.columns.mobile).toBe('number');
    expect(typeof media.grid.gap).toBe('string');
    expect(media.image).toBeDefined();
    expect(typeof media.image.format).toBe('string');
    expect(typeof media.image.quality).toBe('number');
    expect(media.image.widths).toBeDefined();
    expect(Array.isArray(media.image.widths.medium)).toBe(true);
    expect(Array.isArray(media.image.widths.high)).toBe(true);
    expect(media.homepage).toBeDefined();
    expect(Array.isArray(media.homepage.featured)).toBe(true);
    expect(media.homepage.carousel).toBeDefined();
    expect(typeof media.homepage.carousel.ariaLabel).toBe('string');
  });

  it('loadPhotographyPage returns photography page config', async () => {
    const page = await loadPhotographyPage();
    const photo = page.photographyConfig;
    expect(photo).toBeDefined();
    expect(photo.grid).toBeDefined();
    expect(typeof photo.grid.columns.desktop).toBe('number');
    expect(typeof photo.grid.columns.mobile).toBe('number');
    expect(typeof photo.grid.gap).toBe('string');
  });

  it('loadSiteMetadata returns metadata', () => {
    const meta = loadSiteMetadata();
    expect(meta).toBeDefined();
    expect(typeof meta.siteUrl).toBe('string');
    expect(typeof meta.defaultTitle).toBe('string');
    expect(typeof meta.defaultDescription).toBe('string');
    expect(meta.keyword).toBeDefined();
  });

  it('loadEffectsConfig returns effects config with expected structure', async () => {
    const effects = await loadEffectsConfig();
    expect(effects).toBeDefined();
    expect(effects.starfield).toBeDefined();
    expect(typeof (effects.starfield as Record<string, unknown>).enabled).toBe('boolean');
  });
});

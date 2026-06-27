import { describe, expect, it, beforeEach } from 'vitest';
import '../../../src/plugins/starfield';
import {
  loadHomepageConfig,
  loadMediaConfig,
  loadNavigationConfig,
  loadSiteMetadata,
} from '../../../src/lib/loaders/config-loader';
import { loadSiteConfig, resetSiteConfig, parseSiteConfig } from '../../../src/lib/loaders/config-cache';
import { loadPhotography, loadEffectsConfig } from '../../../src/lib/loaders/photography-effects-loader';

describe('parseSiteConfig', () => {
  it('parses plain JSON', () => {
    const raw = JSON.stringify({ metadata: { siteUrl: 'https://example.com', defaultTitle: 'Test', defaultDescription: 'Desc' }, navigation: { order: ['home'] }, home: { hero: { eyebrow: 'Hi' }, layout: { contentWidth: 'wide', sectionOrder: ['hero'], editorialGapVariant: 'tight' }, editorialHero: { deckFields: ['location'], showDeckDivider: true }, featuredMedia: { items: [], carousel: { ariaLabel: 'Carousel', prevButtonAriaLabel: 'Prev', nextButtonAriaLabel: 'Next', emptyText: 'Empty', showNavigationArrows: false, showIndicator: false, counterPadLength: 2, visual: { spaceBetween: 0, slideWidth: { desktop: '40%', tablet: '60%', mobile: '80%' }, inactiveOpacity: 1 } } } }, image: { format: 'webp', quality: 80, widths: { medium: [480], high: [960] }, dprScale: { low: 0.8, medium: 1, high: 2 }, lazyLoad: { rootMargin: '100px', localDebugDelayMs: 0 }, placeholderEffect: 'bars-height-wave' }, photography: { grid: { columns: { desktop: 3, mobile: 2 }, gap: '1rem' } }, effects: { starfield: { enabled: true } } });
    const config = parseSiteConfig(raw);
    expect(config.metadata.siteUrl).toBe('https://example.com');
    expect(config.navigation.order).toEqual(['home']);
  });

  it('parses JSONC with comments', () => {
    const raw = `{
      // line comment
      "metadata": { "siteUrl": "https://example.com", "defaultTitle": "T", "defaultDescription": "D" },
      /* block comment */
      "navigation": { "order": ["home"] },
      "home": { "hero": { "eyebrow": "Hi" }, "layout": { "contentWidth": "wide", "sectionOrder": ["hero"], "editorialGapVariant": "tight" }, "editorialHero": { "deckFields": ["location"], "showDeckDivider": true }, "featuredMedia": { "items": [], "carousel": { "ariaLabel": "C", "prevButtonAriaLabel": "P", "nextButtonAriaLabel": "N", "emptyText": "E", "showNavigationArrows": false, "showIndicator": false, "counterPadLength": 2, "visual": { "spaceBetween": 0, "slideWidth": { "desktop": "40%", "tablet": "60%", "mobile": "80%" }, "inactiveOpacity": 1 } } } },
      "image": { "format": "webp", "quality": 80, "widths": { "medium": [480], "high": [960] }, "dprScale": { "low": 0.8, "medium": 1, "high": 2 }, "lazyLoad": { "rootMargin": "100px", "localDebugDelayMs": 0 }, "placeholderEffect": "bars-height-wave" },
      "photography": { "grid": { "columns": { "desktop": 3, "mobile": 2 }, "gap": "1rem" } },
      "effects": { "starfield": { "enabled": true } }
    }`;
    const config = parseSiteConfig(raw);
    expect(config.metadata.siteUrl).toBe('https://example.com');
    expect(config.navigation.order).toEqual(['home']);
  });

  it('parses JSONC with trailing commas', () => {
    const raw = `{
      "metadata": { "siteUrl": "https://example.com", "defaultTitle": "T", "defaultDescription": "D" },
      "navigation": { "order": ["home",], },
      "home": { "hero": { "eyebrow": "Hi" }, "layout": { "contentWidth": "wide", "sectionOrder": ["hero"], "editorialGapVariant": "tight" }, "editorialHero": { "deckFields": ["location"], "showDeckDivider": true }, "featuredMedia": { "items": [], "carousel": { "ariaLabel": "C", "prevButtonAriaLabel": "P", "nextButtonAriaLabel": "N", "emptyText": "E", "showNavigationArrows": false, "showIndicator": false, "counterPadLength": 2, "visual": { "spaceBetween": 0, "slideWidth": { "desktop": "40%", "tablet": "60%", "mobile": "80%" }, "inactiveOpacity": 1 } } } },
      "image": { "format": "webp", "quality": 80, "widths": { "medium": [480], "high": [960] }, "dprScale": { "low": 0.8, "medium": 1, "high": 2 }, "lazyLoad": { "rootMargin": "100px", "localDebugDelayMs": 0 }, "placeholderEffect": "bars-height-wave" },
      "photography": { "grid": { "columns": { "desktop": 3, "mobile": 2 }, "gap": "1rem" } },
      "effects": { "starfield": { "enabled": true } },
    }`;
    const config = parseSiteConfig(raw);
    expect(config.metadata.siteUrl).toBe('https://example.com');
    expect(config.navigation.order).toEqual(['home']);
  });

  it('throws for non-object root', () => {
    expect(() => parseSiteConfig('null')).toThrow('Failed to parse site config from config.jsonc: invalid JSONC content');
    expect(() => parseSiteConfig('42')).toThrow('Failed to parse site config from config.jsonc: invalid JSONC content');
    expect(() => parseSiteConfig('"string"')).toThrow('Failed to parse site config from config.jsonc: invalid JSONC content');
  });

  it('throws for array root', () => {
    expect(() => parseSiteConfig('[]')).toThrow('Failed to parse site config from config.jsonc: invalid JSONC content');
    expect(() => parseSiteConfig('[1, 2, 3]')).toThrow('Failed to parse site config from config.jsonc: invalid JSONC content');
  });

  it('throws for invalid JSON', () => {
    expect(() => parseSiteConfig('{ invalid json')).toThrow();
  });
});

describe('config-loader lazy singleton', () => {
  beforeEach(() => {
    resetSiteConfig();
  });

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

  it('loadPhotography returns photography page config', () => {
    const photo = loadPhotography();
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

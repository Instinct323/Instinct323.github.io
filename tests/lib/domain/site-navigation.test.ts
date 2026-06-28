import { describe, expect, it } from 'vitest';
import {
  formatPageLabel,
  buildPrimaryNavModel,
  type SiteNavItem,
  type SiteNavModel,
} from '~/features/site/navigation';
import type { NavigationConfig } from '~/features/site/types';

function buildRoutes(): NavigationConfig['routes'] {
  return {
    home: { key: 'home', href: '/' },
    about: { key: 'about', href: '/about' },
    photography: { key: 'photography', href: '/photography' },
    blog: { key: 'blog', href: '/blog' },
  };
}

describe('formatPageLabel', () => {
  it("returns '' for empty string", () => {
    expect(formatPageLabel('')).toBe('');
  });

  it("returns 'About' for 'about'", () => {
    expect(formatPageLabel('about')).toBe('About');
  });

  it("returns 'Photography' for 'photography'", () => {
    expect(formatPageLabel('photography')).toBe('Photography');
  });

  it('capitalizes single character correctly', () => {
    expect(formatPageLabel('a')).toBe('A');
  });

  it('capitalizes multi-word keys correctly', () => {
    expect(formatPageLabel('my-page')).toBe('My-page');
  });
});

describe('navigation.routes', () => {
  it("contains 'home', 'about', 'photography', 'blog' keys via buildPrimaryNavModel", () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about', 'photography', 'blog'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);
    const keys = result.items.map((item) => item.key);

    expect(keys).toContain('home');
    expect(keys).toContain('about');
    expect(keys).toContain('photography');
    expect(keys).toContain('blog');
  });

  it('each entry has path and label properties via buildPrimaryNavModel', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    result.items.forEach((item) => {
      expect(item).toHaveProperty('key');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('testId');
      expect(item).toHaveProperty('label');
      expect(typeof item.key).toBe('string');
      expect(typeof item.href).toBe('string');
      expect(typeof item.testId).toBe('string');
      expect(typeof item.label).toBe('string');
    });
  });

  it('has correct route configurations', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about', 'photography', 'blog'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.items[0]).toEqual({
      key: 'home',
      href: '/',
      testId: 'nav-home',
      label: 'Home',
    });
    expect(result.items[1]).toEqual({
      key: 'about',
      href: '/about',
      testId: 'nav-about',
      label: 'About',
    });
    expect(result.items[2]).toEqual({
      key: 'photography',
      href: '/photography',
      testId: 'nav-photography',
      label: 'Photography',
    });
    expect(result.items[3]).toEqual({
      key: 'blog',
      href: '/blog',
      testId: 'nav-blog',
      label: 'Blog',
    });
  });
});

describe('buildPrimaryNavModel', () => {
  it('returns nav items with correct labels and paths for valid navigation config', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about', 'photography'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.ariaLabel).toBe('Primary navigation');
    expect(result.items).toHaveLength(3);

    expect(result.items[0]).toEqual({
      key: 'home',
      href: '/',
      testId: 'nav-home',
      label: 'Home',
    });

    expect(result.items[1]).toEqual({
      key: 'about',
      href: '/about',
      testId: 'nav-about',
      label: 'About',
    });

    expect(result.items[2]).toEqual({
      key: 'photography',
      href: '/photography',
      testId: 'nav-photography',
      label: 'Photography',
    });
  });

  it('returns empty items array when order is empty', () => {
    const navigation: NavigationConfig = {
      order: [],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.ariaLabel).toBe('Primary navigation');
    expect(result.items).toEqual([]);
  });

  it('handles single item in order', () => {
    const navigation: NavigationConfig = {
      order: ['blog'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      key: 'blog',
      href: '/blog',
      testId: 'nav-blog',
      label: 'Blog',
    });
  });

  it('handles all routes in order', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about', 'photography', 'blog'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.items).toHaveLength(4);
    expect(result.items.map((item) => item.key)).toEqual([
      'home',
      'about',
      'photography',
      'blog',
    ]);
  });

  it('preserves order from navigation config', () => {
    const navigation: NavigationConfig = {
      order: ['blog', 'photography', 'about', 'home'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.items.map((item) => item.key)).toEqual([
      'blog',
      'photography',
      'about',
      'home',
    ]);
  });

  it('throws when an order key is missing from routes', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'missing-key'],
      routes: buildRoutes(),
    };

    expect(() => buildPrimaryNavModel(navigation)).toThrow(
      'buildNavItems: key "missing-key" not found in navigation.routes',
    );
  });
});

describe('buildNavItems (via buildPrimaryNavModel)', () => {
  it('verify output structure matches type contract', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result).toHaveProperty('ariaLabel');
    expect(result).toHaveProperty('items');
    expect(typeof result.ariaLabel).toBe('string');
    expect(Array.isArray(result.items)).toBe(true);

    result.items.forEach((item: SiteNavItem) => {
      expect(item).toHaveProperty('key');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('testId');
      expect(item).toHaveProperty('label');
      expect(typeof item.key).toBe('string');
      expect(typeof item.href).toBe('string');
      expect(typeof item.testId).toBe('string');
      expect(typeof item.label).toBe('string');
    });
  });

  it('generates correct label from formatPageLabel', () => {
    const navigation: NavigationConfig = {
      order: ['home', 'about'],
      routes: buildRoutes(),
    };

    const result: SiteNavModel = buildPrimaryNavModel(navigation);

    expect(result.items[0].label).toBe(formatPageLabel('home'));
    expect(result.items[1].label).toBe(formatPageLabel('about'));
  });
});

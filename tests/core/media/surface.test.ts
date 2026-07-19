import { describe, expect, it } from 'vitest';
import { computeContentImageOptionsFromConfig } from '~/core/media/surface';
import type { MediaConfig } from '~/features/site/types';

const validMediaConfig: MediaConfig = {
  grid: {
    columns: { desktop: 3, mobile: 2 },
    gap: '1rem',
  },
  image: {
    format: 'webp',
    quality: 80,
    widths: {
      medium: [320, 640, 960],
      high: [960, 1280, 1920],
    },
    dprScale: {
      low: 1,
      medium: 1.5,
      high: 2,
    },
    lazyLoad: {
      rootMargin: '100px',
    },
    placeholderEffect: 'bars-scale-y',
  },
  homepage: {
    featured: ['photography/0-travel/img1.jpg'],
    carousel: {
      ariaLabel: 'test',
      prevButtonAriaLabel: 'prev',
      nextButtonAriaLabel: 'next',
      emptyText: 'empty',
      showNavigationArrows: true,
      showIndicator: true,
      counterPadLength: 2,
      visual: {
        spaceBetween: 10,
        slideWidth: { desktop: '50%', tablet: '70%', mobile: '90%' },
        inactiveOpacity: 0.5,
      },
    },
  },
};

describe('computeContentImageOptionsFromConfig', () => {
  it('is synchronous and returns ContentImageOptions for about surface', () => {
    const result = computeContentImageOptionsFromConfig(validMediaConfig, 'about', {
      alt: 'Avatar',
    });

    expect(result.format).toBe('webp');
    expect(result.quality).toBe(80);
    expect(result.alt).toBe('Avatar');
    expect(result.sizes).toContain('767px');
    expect(Array.isArray(result.widths)).toBe(true);
    expect(result.widths!.length).toBeGreaterThan(0);
  });

  it('is synchronous and returns ContentImageOptions for photography surface', () => {
    const result = computeContentImageOptionsFromConfig(validMediaConfig, 'photography', {});

    expect(result.format).toBe('webp');
    expect(result.quality).toBe(80);
    expect(result.sizes).toContain('vw');
    expect(Array.isArray(result.widths)).toBe(true);
    expect(result.widths!.length).toBeGreaterThan(0);
  });

  it('uses homepageWidths when surface is home', () => {
    const homepageWidths = [480, 640, 768];
    const result = computeContentImageOptionsFromConfig(
      validMediaConfig,
      'home',
      { alt: 'Hero' },
      homepageWidths,
    );

    expect(result.format).toBe('webp');
    expect(result.quality).toBe(80);
    expect(result.alt).toBe('Hero');
    expect(result.widths).toEqual(homepageWidths);
    expect(result.sizes).toContain('480px');
  });

  it('applies overrides over config defaults', () => {
    const result = computeContentImageOptionsFromConfig(validMediaConfig, 'about', {
      format: 'png',
      quality: 90,
    });

    expect(result.format).toBe('png');
    expect(result.quality).toBe(90);
  });

  it('does not mutate the input MediaConfig', () => {
    const original = JSON.stringify(validMediaConfig);
    computeContentImageOptionsFromConfig(validMediaConfig, 'photography', {});
    expect(JSON.stringify(validMediaConfig)).toBe(original);
  });
});

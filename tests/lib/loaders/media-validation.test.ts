import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/lib/media/resolution', () => ({
  normalizeContentImagePath: vi.fn((p: string) => p),
  resolveContentImageMetadata: vi.fn(() => null),
}));

import { assertMediaConfigShape } from '~/core/media/config';
import type { MediaConfig } from '~/features/site/types';

describe('assertMediaConfigShape', () => {
  const validConfig: MediaConfig = {
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
        localDebugDelayMs: 0,
      },
      placeholderEffect: 'none' as any,
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

  it('passes for a valid MediaConfig', () => {
    expect(() => assertMediaConfigShape(validConfig)).not.toThrow();
  });

  it('throws when grid is missing', () => {
    const { grid: _grid, ...noGrid } = validConfig;
    expect(() => assertMediaConfigShape(noGrid as any)).toThrow(/missing media grid/);
  });

  it('throws when grid.columns is missing', () => {
    expect(() =>
      assertMediaConfigShape({ ...validConfig, grid: { gap: '1rem' } } as any),
    ).toThrow(/missing media grid/);
  });

  it('throws when image is missing', () => {
    const { image: _image, ...noImage } = validConfig;
    expect(() => assertMediaConfigShape(noImage as any)).toThrow(/missing media/);
  });

  it('throws when homepage.carousel is missing', () => {
    const badConfig = {
      ...validConfig,
      homepage: { featured: ['a'] },
    };
    expect(() => assertMediaConfigShape(badConfig as any)).toThrow(/missing media/);
  });

  it('throws for invalid medium widths', () => {
    const badConfig = {
      ...validConfig,
      image: {
        ...validConfig.image,
        widths: { ...validConfig.image.widths, medium: [] },
      },
    };
    expect(() => assertMediaConfigShape(badConfig)).toThrow(/non-empty array/);
  });

  it('throws for invalid high widths', () => {
    const badConfig = {
      ...validConfig,
      image: {
        ...validConfig.image,
        widths: { ...validConfig.image.widths, high: [100, 50] },
      },
    };
    expect(() => assertMediaConfigShape(badConfig)).toThrow(/strictly increasing/);
  });

  it('throws for non-positive dprScale values', () => {
    const badConfig = {
      ...validConfig,
      image: {
        ...validConfig.image,
        dprScale: { ...validConfig.image.dprScale, medium: -1 },
      },
    };
    expect(() => assertMediaConfigShape(badConfig)).toThrow(/positive number/);
  });
});
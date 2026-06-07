import { describe, expect, it, vi } from 'vitest';
import {
  assertStrictlyIncreasingPositiveWidths,
  selectCandidateWidthsByPolicy,
} from '../../../src/lib/utils/image-width-utils';

vi.mock('./media-loader-core', () => ({
  normalizeContentImagePath: vi.fn((p: string) => p),
  resolveContentImageMetadata: vi.fn(() => null),
  assertPositiveScale: vi.fn((v: unknown, key: string) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      throw new Error(`Invalid ${key}: expected a positive number.`);
    }
    return v;
  }),
}));

import { assertMediaConfigShape } from '../../../src/lib/loaders/media-validation';
import type { MediaConfig } from '../../../src/types';

describe('assertStrictlyIncreasingPositiveWidths', () => {
  it('accepts a valid strictly increasing array of positive numbers', () => {
    const result = assertStrictlyIncreasingPositiveWidths([100, 200, 400], 'test.key');
    expect(result).toEqual([100, 200, 400]);
  });

  it('throws for empty array', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([], 'test.key')).toThrow(
      /non-empty array/,
    );
  });

  it('throws for non-array input', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths(null, 'test.key')).toThrow(
      /non-empty array/,
    );
  });

  it('throws for non-strictly-increasing values', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([100, 100, 200], 'test.key')).toThrow(
      /strictly increasing/,
    );
  });

  it('throws for decreasing values', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([400, 200, 100], 'test.key')).toThrow(
      /strictly increasing/,
    );
  });

  it('throws for zero or negative values', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([0, 100, 200], 'test.key')).toThrow(
      /positive integer/,
    );
    expect(() => assertStrictlyIncreasingPositiveWidths([-100, 100, 200], 'test.key')).toThrow(
      /positive integer/,
    );
  });

  it('throws for non-finite values (NaN, Infinity)', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([100, NaN, 200], 'test.key')).toThrow(
      /positive integer/,
    );
    expect(() =>
      assertStrictlyIncreasingPositiveWidths([100, Infinity, 200], 'test.key'),
    ).toThrow(/positive integer/);
  });

  it('includes the key in error messages', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([], 'my.custom.key')).toThrow(
      'my.custom.key',
    );
  });
});

describe('selectCandidateWidthsByPolicy', () => {
  it('selects a single bucket width that covers the scaled target', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960, 1280],
      inferredWidths: [400, 600],
      dprScale: 1,
      key: 'test',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThanOrEqual(600);
  });

  it('applies dprScale to compute target width', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960, 1280],
      inferredWidths: [400],
      dprScale: 2,
      key: 'test',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThanOrEqual(800);
  });

  it('returns the largest candidate when no candidate exceeds target', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 480],
      inferredWidths: [600],
      dprScale: 2,
      key: 'test',
    });
    expect(result).toEqual([480]);
  });

  it('respects maxSelectableWidth by filtering candidates', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960, 1280],
      inferredWidths: [100],
      dprScale: 1,
      key: 'test',
      maxSelectableWidth: 640,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeLessThanOrEqual(640);
  });

  it('deduplicates and sorts inferred widths before computing target', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960],
      inferredWidths: [400, 400, 600],
      dprScale: 1,
      key: 'test',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThanOrEqual(600);
  });

  it('throws for non-positive dprScale', () => {
    expect(() =>
      selectCandidateWidthsByPolicy({
        candidateWidths: [320, 640],
        inferredWidths: [400],
        dprScale: 0,
        key: 'test',
      }),
    ).toThrow(/positive number/);
  });

  it('throws when maxSelectableWidth filters out all candidates', () => {
    expect(() =>
      selectCandidateWidthsByPolicy({
        candidateWidths: [960, 1280],
        inferredWidths: [400],
        dprScale: 1,
        key: 'test',
        maxSelectableWidth: 320,
      }),
    ).toThrow(/no candidate width/);
  });
});

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
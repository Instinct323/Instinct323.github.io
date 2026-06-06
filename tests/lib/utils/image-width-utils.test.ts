import { describe, expect, it } from 'vitest';
import {
  assertStrictlyIncreasingPositiveWidths,
  selectCandidateWidthsByPolicy,
  IMAGE_MEDIUM_WIDTHS_KEY,
  IMAGE_HIGH_WIDTHS_KEY,
} from '../../../src/lib/utils/image-width-utils';

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
      /positive number/,
    );
    expect(() => assertStrictlyIncreasingPositiveWidths([-100, 100, 200], 'test.key')).toThrow(
      /positive number/,
    );
  });

  it('throws for non-finite values (NaN, Infinity)', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([100, NaN, 200], 'test.key')).toThrow(
      /positive number/,
    );
    expect(() =>
      assertStrictlyIncreasingPositiveWidths([100, Infinity, 200], 'test.key'),
    ).toThrow(/positive number/);
  });

  it('includes the key in error messages', () => {
    expect(() => assertStrictlyIncreasingPositiveWidths([], 'my.custom.key')).toThrow(
      'my.custom.key',
    );
  });
});

describe('selectCandidateWidthsByPolicy', () => {
  it('selects standard breakpoint width that covers scaled target', () => {
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

  it('respects maxSelectableWidth by filtering candidates (min constraint)', () => {
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

  it('enforces maxSelectableWidth when target exceeds all candidates', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960],
      inferredWidths: [2000],
      dprScale: 1,
      key: 'test',
      maxSelectableWidth: 640,
    });
    expect(result).toEqual([640]);
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

  it('handles high-DPR scenario for retina displays', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960, 1280, 1920, 2560],
      inferredWidths: [1200],
      dprScale: 3,
      key: 'test',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(2560); // selects first >= 3600
  });

  it('selects correct width for mobile-first with medium DPR', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960, 1280],
      inferredWidths: [375],
      dprScale: 2,
      key: 'test',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(960);
  });

  it('generates srcset-ready width array via multiple calls', () => {
    const inferredWidthSets = [
      [320, 480],
      [640, 960],
      [1024, 1440],
    ];
    const dprScales = [1, 1.5, 2];

    const widths = inferredWidthSets.map((inferredWidths, i) =>
      selectCandidateWidthsByPolicy({
        candidateWidths: [320, 640, 960, 1280, 1920],
        inferredWidths,
        dprScale: dprScales[i],
        key: 'test',
      })[0],
    );

    expect(widths).toHaveLength(3);
    expect(widths[0]).toBe(640);
    expect(widths[1]).toBe(1920);
    expect(widths[2]).toBe(1920);
  });
});

describe('IMAGE_WIDTHS_KEY constants', () => {
  it('exports correct medium key', () => {
    expect(IMAGE_MEDIUM_WIDTHS_KEY).toBe('image.widths.medium');
  });

  it('exports correct high key', () => {
    expect(IMAGE_HIGH_WIDTHS_KEY).toBe('image.widths.high');
  });
});

describe('Responsive image width calculation scenarios', () => {
  it('calculates widths for blog thumbnail grid', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [200, 400, 800, 1200],
      inferredWidths: [300],
      dprScale: 1,
      key: 'blog.thumbnail',
    });
    expect(result).toEqual([400]);
  });

  it('calculates widths for full-width hero image', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [640, 960, 1280, 1920, 2560],
      inferredWidths: [1920],
      dprScale: 1,
      key: 'hero.fullwidth',
    });
    expect(result).toEqual([1920]);
  });

  it('calculates widths for carousel slide with varying viewport', () => {
    const viewportWidths = [375, 768, 1024, 1440];
    const results = viewportWidths.map((vw) =>
      selectCandidateWidthsByPolicy({
        candidateWidths: [320, 640, 960, 1280, 1920],
        inferredWidths: [vw],
        dprScale: 2,
        key: 'carousel',
      })[0],
    );

    expect(results).toEqual([960, 1920, 1920, 1920]);
  });

  it('respects min width constraint via maxSelectableWidth', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960],
      inferredWidths: [200],
      dprScale: 1,
      key: 'test',
      maxSelectableWidth: 960,
    });
    expect(result).toEqual([320]);
  });

  it('handles very small inferred width with min constraint', () => {
    const result = selectCandidateWidthsByPolicy({
      candidateWidths: [320, 640, 960],
      inferredWidths: [50],
      dprScale: 1,
      key: 'test',
      maxSelectableWidth: 320,
    });
    expect(result).toEqual([320]);
  });
});
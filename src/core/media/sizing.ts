import { assertPositiveInteger, parseNumericMatch, assertPositiveIntegerArray, assertPositiveScale } from '~/core/validation/assert';
import type { MediaConfig } from '~/features/site/types';

export const MOBILE_BREAKPOINT = 767;
export const RESPONSIVE_VIEWPORT_WIDTHS = {
  desktop: 1440,
  tablet: 1024,
  mobile: 375,
} as const;

export interface GridDefinition {
  columns: {
    desktop: number;
    mobile: number;
  };
  gap: string;
}

function parseGridGapToPx(gap: string): number {
  const normalized = gap.trim();
  const { numeric, match } = parseNumericMatch(
    normalized,
    /^(\d+(?:\.\d+)?)(px|rem)$/,
    `Invalid photography.grid.gap: "${gap}". Expected px or rem value.`,
  );
  if (numeric < 0) {
    throw new Error(`Invalid photography.grid.gap: "${gap}". Expected a non-negative value.`);
  }

  return match[2] === 'rem' ? numeric * 16 : numeric;
}

function computeGridCellWidth(viewportWidth: number, columns: number, gapPx: number): number {
  if (!Number.isInteger(columns) || columns <= 0) {
    throw new Error(`Invalid grid columns: expected a positive integer, received ${String(columns)}.`);
  }

  const totalGap = (columns - 1) * gapPx;
  const contentWidth = viewportWidth - totalGap;

  if (contentWidth <= 0) {
    throw new Error('Invalid gallery grid config: horizontal gaps exceed viewport width.');
  }

  return Math.round(contentWidth / columns);
}

/** Computes grid cell widths for mobile, tablet, and desktop viewports. */
export function computeGridCellWidths(
  grid: GridDefinition,
  { mobile, tablet, desktop }: { mobile: number; tablet: number; desktop: number }
): number[] {
  const gapPx = parseGridGapToPx(grid.gap);

  return [
    computeGridCellWidth(mobile, grid.columns.mobile, gapPx),
    computeGridCellWidth(tablet, grid.columns.desktop, gapPx),
    computeGridCellWidth(desktop, grid.columns.desktop, gapPx),
  ];
}

/** Builds a responsive `sizes` attribute for grid images from column counts. */
export function createGridSizesString(grid: GridDefinition): string {
  const mobileColumns = assertPositiveInteger(
    grid.columns.mobile,
    'photography.grid.columns.mobile',
  );
  const desktopColumns = assertPositiveInteger(
    grid.columns.desktop,
    'photography.grid.columns.desktop',
  );

  const mobile_width = (100 / mobileColumns).toFixed(2);
  const desktop_width = (100 / desktopColumns).toFixed(2);

  return [
    `(max-width: ${MOBILE_BREAKPOINT}px) ${mobile_width}vw`,
    `${desktop_width}vw`,
  ].join(', ');
}

export const IMAGE_MEDIUM_WIDTHS_KEY = 'image.widths.medium';
export const IMAGE_HIGH_WIDTHS_KEY = 'image.widths.high';

export interface CandidateWidthPolicyInput {
  candidateWidths: number[];
  inferredWidths: number[];
  dprScale: number;
  key: string;
  maxSelectableWidth?: number;
}

export function assertStrictlyIncreasingPositiveWidths(widths: unknown, key: string): number[] {
  const validated = assertPositiveIntegerArray(widths, key);

  let previous = 0;

  return validated.map((width) => {
    if (width <= previous) {
      throw new Error(`Invalid ${key}: expected a strictly increasing list of positive numbers.`);
    }

    previous = width;
    return width;
  });
}

function normalizeInferredWidths(inferredWidths: number[], key: string): number[] {
  return assertStrictlyIncreasingPositiveWidths(
    Array.from(new Set(inferredWidths)).sort((a, b) => a - b),
    `${key}.inferredWidths`,
  );
}

function computeScaledTargetWidth(inferredWidths: number[], dprScale: number): number {
  return Math.ceil(Math.max(...inferredWidths) * dprScale);
}

/**
 * Selects the smallest candidate that satisfies the target width.
 * If the target exceeds every candidate, returns the maximum candidate.
 */
function selectSingleBucket(candidateWidths: number[], targetWidth: number): number {
  const matched = candidateWidths.find((candidateWidth) => candidateWidth >= targetWidth);
  return matched ?? candidateWidths[candidateWidths.length - 1];
}

/**
 * Filters candidates by `maxSelectableWidth`. Throws when every candidate
 * is larger than the bound, because no valid selection would exist.
 */
function normalizeCandidateWidths(
  candidateWidths: number[],
  key: string,
  maxSelectableWidth?: number,
): number[] {
  const normalizedCandidates = assertStrictlyIncreasingPositiveWidths(candidateWidths, key);

  if (maxSelectableWidth === undefined) {
    return normalizedCandidates;
  }

  const normalizedMax = assertPositiveScale(maxSelectableWidth, `${key}.maxSelectableWidth`);
  const bounded = normalizedCandidates.filter((candidateWidth) => candidateWidth <= normalizedMax);

  if (bounded.length > 0) {
    return bounded;
  }

  throw new Error(`Invalid ${key}: no candidate width is <= maxSelectableWidth (${normalizedMax}).`);
}

/**
 * Selects the best candidate width for each inferred width using DPR-scaled bucket matching.
 *
 * `inferredWidths` is sourced by the caller: `surface.ts` derives it from
 * avatar sizes (`ABOUT_AVATAR_INFERRED_WIDTHS`) or gallery grid cell widths
 * (`computeGalleryWidthsFromGrid`); `config.ts` derives it from carousel
 * `slideWidth` percentages (`computeCarouselInferredWidths`).
 */
export function selectCandidateWidthsByPolicy(input: CandidateWidthPolicyInput): number[] {
  const {
    candidateWidths,
    inferredWidths,
    dprScale,
    key,
    maxSelectableWidth,
  } = input;

  const normalizedScale = assertPositiveScale(dprScale, `${key}.dprScale`);
  const normalizedCandidates = normalizeCandidateWidths(candidateWidths, key, maxSelectableWidth);
  const normalizedInferred = normalizeInferredWidths(inferredWidths, key);
  const targetWidth = computeScaledTargetWidth(normalizedInferred, normalizedScale);
  const selected = selectSingleBucket(normalizedCandidates, targetWidth);

  return [selected];
}

export const RESPONSIVE_WIDTH_STEPS = [320, 480, 640, 768, 960, 1200, 1600, 2000, 2400];

export interface ResponsiveWidthProfile {
  desktop: number;
  tablet: number;
  mobile: number;
}

interface ResponsiveSlideWidthPercent {
  desktop: string;
  tablet: string;
  mobile: string;
}

/** Generates responsive width steps for a carousel slide up to its effective max width. */
export function computeCarouselResponsiveWidths(
  viewportWidth: number,
  cssPercentage: number,
  maxLongEdge: number
): number[] {
  if (maxLongEdge <= 0) {
    return [];
  }

  const targetWidth = Math.round(viewportWidth * (cssPercentage / 100));
  const effectiveMaxWidth = Math.min(targetWidth, maxLongEdge);

  const widths = RESPONSIVE_WIDTH_STEPS.filter(width => width < effectiveMaxWidth);

  if (effectiveMaxWidth > 0) {
    widths.push(effectiveMaxWidth);
  }

  return Array.from(new Set(widths)).sort((a, b) => a - b);
}

/** Merges responsive widths across desktop, tablet, and mobile profiles. */
export function computeLayoutResponsiveWidths(
  profile: ResponsiveWidthProfile,
  maxLongEdge: number
): number[] {
  const entries: Array<[keyof ResponsiveWidthProfile, number]> = [
    ['desktop', RESPONSIVE_VIEWPORT_WIDTHS.desktop],
    ['tablet', RESPONSIVE_VIEWPORT_WIDTHS.tablet],
    ['mobile', RESPONSIVE_VIEWPORT_WIDTHS.mobile],
  ];
  const merged = entries.flatMap(([key, viewport]) => {
    return computeCarouselResponsiveWidths(viewport, profile[key], maxLongEdge);
  });

  return Array.from(new Set(merged))
    .sort((a, b) => a - b);
}

function parseResponsivePercentage(value: string, key: string): number {
  const { numeric } = parseNumericMatch(value, /(\d+(?:\.\d+)?)/, `Invalid ${key} value: "${value}".`);
  if (numeric <= 0) {
    throw new Error(`Invalid ${key} value: "${value}".`);
  }
  return numeric;
}

/** Parses slide-width percentages and resolves inferred responsive widths. */
export function computeCarouselInferredWidths(slideWidth: ResponsiveSlideWidthPercent): number[] {
  const profile: ResponsiveWidthProfile = {
    desktop: parseResponsivePercentage(slideWidth.desktop, 'carousel.slideWidth.desktop'),
    tablet: parseResponsivePercentage(slideWidth.tablet, 'carousel.slideWidth.tablet'),
    mobile: parseResponsivePercentage(slideWidth.mobile, 'carousel.slideWidth.mobile'),
  };

  return computeLayoutResponsiveWidths(profile, Number.POSITIVE_INFINITY);
}

/**
 * Derives gallery cell widths from the grid definition at standard breakpoints.
 *
 * Used by `surface.ts` to produce the `inferredWidths` consumed by
 * `selectCandidateWidthsByPolicy` for non-homepage surfaces (photography gallery).
 */
export function computeGalleryWidthsFromGrid(grid: MediaConfig['grid']): number[] {
  return computeGridCellWidths(grid, {
    mobile: RESPONSIVE_VIEWPORT_WIDTHS.mobile,
    tablet: RESPONSIVE_VIEWPORT_WIDTHS.tablet,
    desktop: RESPONSIVE_VIEWPORT_WIDTHS.desktop,
  });
}

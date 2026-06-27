import { RESPONSIVE_VIEWPORT_WIDTHS, computeGridCellWidths } from '../utils/grid-width-utils';
import type { MediaConfig } from '../../types/site';

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

  return Array.from(new Set(widths.filter(width => width > 0))).sort((a, b) => a - b);
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

/** Extracts a positive numeric percentage from a CSS-like string (e.g. "50%" or "33.3%"). Throws when the value is missing, non-numeric, or not positive, so invalid config surfaces early instead of producing broken responsive widths. */
function parseResponsivePercentage(value: string, key: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`Invalid ${key} value: "${value}".`);
  }

  const parsed = Number.parseFloat(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key} value: "${value}".`);
  }

  return parsed;
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

/** Derives gallery cell widths from the grid definition at standard breakpoints. */
export function computeGalleryWidthsFromGrid(grid: MediaConfig['grid']): number[] {
  return computeGridCellWidths(grid, {
    mobile: RESPONSIVE_VIEWPORT_WIDTHS.mobile,
    tablet: RESPONSIVE_VIEWPORT_WIDTHS.tablet,
    desktop: RESPONSIVE_VIEWPORT_WIDTHS.desktop,
  });
}
import { RESPONSIVE_VIEWPORT_WIDTHS, computeGridCellWidths } from '../utils/grid-width-utils';
import { selectCandidateWidthsByPolicy, IMAGE_MEDIUM_WIDTHS_KEY } from '../utils/image-width-utils';
import type { MediaConfig, HomePageCarouselConfig } from '../../types';

export const RESPONSIVE_WIDTH_STEPS = [320, 480, 640, 768, 960, 1200, 1600, 2000, 2400];
export const HOME_COVERFLOW_MOBILE_BREAKPOINT = 767;
export const HOME_COVERFLOW_SIZES = `(max-width: ${HOME_COVERFLOW_MOBILE_BREAKPOINT}px) 480px, (max-width: 1024px) 640px, 768px`;

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

export function computeCarouselInferredWidths(slideWidth: ResponsiveSlideWidthPercent): number[] {
  const profile: ResponsiveWidthProfile = {
    desktop: parseResponsivePercentage(slideWidth.desktop, 'carousel.slideWidth.desktop'),
    tablet: parseResponsivePercentage(slideWidth.tablet, 'carousel.slideWidth.tablet'),
    mobile: parseResponsivePercentage(slideWidth.mobile, 'carousel.slideWidth.mobile'),
  };

  return computeLayoutResponsiveWidths(profile, Number.POSITIVE_INFINITY);
}

export function computeGalleryWidthsFromGrid(grid: MediaConfig['grid']): number[] {
  const viewports = [
    RESPONSIVE_VIEWPORT_WIDTHS.mobile,
    RESPONSIVE_VIEWPORT_WIDTHS.tablet,
    RESPONSIVE_VIEWPORT_WIDTHS.desktop,
  ];

  return computeGridCellWidths(grid, viewports);
}

export function calculateCarouselWidths(
  slideWidth: HomePageCarouselConfig['visual']['slideWidth'],
  candidateWidths: number[],
  homepageDprScale: number,
): number[] {
  const inferredWidths = computeCarouselInferredWidths(slideWidth);

  return selectCandidateWidthsByPolicy({
    candidateWidths,
    inferredWidths,
    dprScale: homepageDprScale,
    key: IMAGE_MEDIUM_WIDTHS_KEY,
  });
}

import { assertPositiveInteger } from './assertions';

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
  const matched = normalized.match(/^(\d+(?:\.\d+)?)(px|rem)$/);

  if (!matched) {
    throw new Error(`Invalid photography.grid.gap: "${gap}". Expected px or rem value.`);
  }

  const value = Number.parseFloat(matched[1]);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid photography.grid.gap: "${gap}". Expected a non-negative value.`);
  }

  return matched[2] === 'rem' ? value * 16 : value;
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

import { describe, expect, it } from 'vitest';
import {
  computeGridCellWidths,
  createGridSizesString,
  MOBILE_BREAKPOINT,
  RESPONSIVE_VIEWPORT_WIDTHS,
  type GridDefinition,
} from '../../../src/lib/media/responsive';

describe('grid-width-utils', () => {
  describe('computeGridCellWidths', () => {
    it('calculates correct cell widths for mobile-first grid', () => {
      const grid: GridDefinition = {
        columns: { desktop: 4, mobile: 2 },
        gap: '16px',
      };
      const viewports = {
        mobile: RESPONSIVE_VIEWPORT_WIDTHS.mobile,   // 375
        tablet: RESPONSIVE_VIEWPORT_WIDTHS.tablet,    // 1024
        desktop: RESPONSIVE_VIEWPORT_WIDTHS.desktop,   // 1440
      };

      const widths = computeGridCellWidths(grid, viewports);

      // Mobile: (375 - (2-1)*16) / 2 = (375 - 16) / 2 = 179.5 → round to 180
      expect(widths[0]).toBe(180);
      // Tablet: (1024 - (4-1)*16) / 4 = (1024 - 48) / 4 = 976 / 4 = 244
      expect(widths[1]).toBe(244);
      // Desktop: (1440 - (4-1)*16) / 4 = (1440 - 48) / 4 = 1392 / 4 = 348
      expect(widths[2]).toBe(348);
    });

    it('handles rem-based gap values', () => {
      const grid: GridDefinition = {
        columns: { desktop: 3, mobile: 1 },
        gap: '1rem', // 16px
      };
      const viewports = { mobile: 375, tablet: 1024, desktop: 1440 };

      const widths = computeGridCellWidths(grid, viewports);

      // Mobile: (375 - (1-1)*16) / 1 = 375
      expect(widths[0]).toBe(375);
      // Tablet: (1024 - (3-1)*16) / 3 = (1024 - 32) / 3 = 992 / 3 ≈ 330.67 → round to 331
      expect(widths[1]).toBe(331);
      // Desktop: (1440 - (3-1)*16) / 3 = (1440 - 32) / 3 = 1408 / 3 ≈ 469.33 → round to 469
      expect(widths[2]).toBe(469);
    });

    it('handles larger gap values', () => {
      const grid: GridDefinition = {
        columns: { desktop: 6, mobile: 3 },
        gap: '24px',
      };
      const viewports = { mobile: 375, tablet: 768, desktop: 1440 };

      const widths = computeGridCellWidths(grid, viewports);

      // Mobile: (375 - (3-1)*24) / 3 = (375 - 48) / 3 = 327 / 3 = 109
      expect(widths[0]).toBe(109);
      // Tablet (768): (768 - (6-1)*24) / 6 = (768 - 120) / 6 = 648 / 6 = 108
      expect(widths[1]).toBe(108);
      // Desktop: (1440 - (6-1)*24) / 6 = (1440 - 120) / 6 = 1320 / 6 = 220
      expect(widths[2]).toBe(220);
    });

    it('throws error for invalid gap format', () => {
      const grid: GridDefinition = {
        columns: { desktop: 2, mobile: 1 },
        gap: 'invalid',
      };

      expect(() => computeGridCellWidths(grid, { mobile: 375, tablet: 1024, desktop: 1440 })).toThrow(
        /Invalid photography.grid.gap/i,
      );
    });

    it('throws error when gaps exceed viewport width', () => {
      const grid: GridDefinition = {
        columns: { desktop: 10, mobile: 5 },
        gap: '100px',
      };

      expect(() => computeGridCellWidths(grid, { mobile: 375, tablet: 1024, desktop: 1440 })).toThrow(
        /horizontal gaps exceed viewport/i,
      );
    });

    it('throws error for zero or negative columns', () => {
      const grid: GridDefinition = {
        columns: { desktop: 0, mobile: 1 },
        gap: '16px',
      };

      expect(() => computeGridCellWidths(grid, { mobile: 375, tablet: 1024, desktop: 1440 })).toThrow(
        /Invalid grid columns/i,
      );
    });

    it('uses provided viewport widths for calculations', () => {
      const grid: GridDefinition = {
        columns: { desktop: 2, mobile: 1 },
        gap: '20px',
      };
      // Custom viewport widths
      const viewports = { mobile: 320, tablet: 800, desktop: 1920 };

      const widths = computeGridCellWidths(grid, viewports);

      // Mobile 320: (320 - 0) / 1 = 320
      expect(widths[0]).toBe(320);
      // Tablet 800: (800 - 20) / 2 = 390
      expect(widths[1]).toBe(390);
      // Desktop 1920: (1920 - 20) / 2 = 950
      expect(widths[2]).toBe(950);
    });
  });

  describe('createGridSizesString', () => {
    it('generates correct sizes string for standard grid', () => {
      const grid: GridDefinition = {
        columns: { desktop: 4, mobile: 2 },
        gap: '16px',
      };

      const result = createGridSizesString(grid);

      expect(result).toBe('(max-width: 767px) 50.00vw, 25.00vw');
    });

    it('generates correct sizes string for single column mobile', () => {
      const grid: GridDefinition = {
        columns: { desktop: 3, mobile: 1 },
        gap: '12px',
      };

      const result = createGridSizesString(grid);

      expect(result).toBe('(max-width: 767px) 100.00vw, 33.33vw');
    });

    it('generates correct sizes string for 6-column desktop', () => {
      const grid: GridDefinition = {
        columns: { desktop: 6, mobile: 3 },
        gap: '8px',
      };

      const result = createGridSizesString(grid);

      expect(result).toBe('(max-width: 767px) 33.33vw, 16.67vw');
    });

    it('uses correct mobile breakpoint constant', () => {
      const grid: GridDefinition = {
        columns: { desktop: 2, mobile: 1 },
        gap: '16px',
      };

      const result = createGridSizesString(grid);

      expect(result).toContain(`(max-width: ${MOBILE_BREAKPOINT}px)`);
      expect(result).toContain('100.00vw, 50.00vw');
    });

    it('handles various column configurations', () => {
      const testCases = [
        { desktop: 1, mobile: 1, expectedDesktop: '100.00vw' },
        { desktop: 2, mobile: 2, expectedDesktop: '50.00vw' },
        { desktop: 3, mobile: 2, expectedDesktop: '33.33vw' },
        { desktop: 4, mobile: 3, expectedDesktop: '25.00vw' },
        { desktop: 5, mobile: 4, expectedDesktop: '20.00vw' },
        { desktop: 8, mobile: 4, expectedDesktop: '12.50vw' },
      ];

      for (const { desktop, mobile, expectedDesktop } of testCases) {
        const grid: GridDefinition = { columns: { desktop, mobile }, gap: '16px' };
        const result = createGridSizesString(grid);
        expect(result).toContain(expectedDesktop);
      }
    });
  });

  describe('constants', () => {
    it('MOBILE_BREAKPOINT is 767', () => {
      expect(MOBILE_BREAKPOINT).toBe(767);
    });

    it('RESPONSIVE_VIEWPORT_WIDTHS has correct values', () => {
      expect(RESPONSIVE_VIEWPORT_WIDTHS).toEqual({
        desktop: 1440,
        tablet: 1024,
        mobile: 375,
      });
    });
  });
});
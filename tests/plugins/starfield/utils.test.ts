import { describe, expect, it, vi } from 'vitest';
import {
  parseHexColorOrDefault,
  calculateDistance,
  randomRange,
  clamp,
  getOrCreateCell,
  calculateConnectionOpacity,
  DPR_CAP,
  IDLE_RESTART_TIME,
  STAR_POINTS,
  starDensities,
  type CellGrid,
  type Star,
} from '../../../src/plugins/starfield/utils';

function makeStar(overrides: Partial<Star> = {}): Star {
  return {
    x: 0,
    y: 0,
    size: 1,
    shape: 'circle',
    speedX: 0,
    speedY: 0,
    rotation: 0,
    rotationSpeed: 0,
    depth: 0.5,
    canConnect: false,
    originalX: 0,
    originalY: 0,
    ...overrides,
  };
}

describe('DPR_CAP', () => {
  it('is 2', () => {
    expect(DPR_CAP).toBe(2);
  });
});

describe('IDLE_RESTART_TIME', () => {
  it('is 1000ms', () => {
    expect(IDLE_RESTART_TIME).toBe(1000);
  });
});

describe('STAR_POINTS', () => {
  it('is 5', () => {
    expect(STAR_POINTS).toBe(5);
  });
});

describe('starDensities', () => {
  it('has all four density levels', () => {
    expect(Object.keys(starDensities)).toEqual(['low', 'medium', 'high', 'ultra']);
  });

  it('values increase with density level', () => {
    expect(starDensities.low).toBeLessThan(starDensities.medium);
    expect(starDensities.medium).toBeLessThan(starDensities.high);
    expect(starDensities.high).toBeLessThan(starDensities.ultra);
  });
});

describe('parseHexColor', () => {
  it('parses a valid 6-digit hex color', () => {
    expect(parseHexColorOrDefault('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHexColorOrDefault('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseHexColorOrDefault('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses uppercase hex digits', () => {
    expect(parseHexColorOrDefault('#ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
  });

  it('parses mixed case hex digits', () => {
    expect(parseHexColorOrDefault('#aAbBcC')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('parses black', () => {
    expect(parseHexColorOrDefault('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white', () => {
    expect(parseHexColorOrDefault('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for strings without hash', () => {
    expect(parseHexColorOrDefault('ff0000')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for 3-digit shorthand', () => {
    expect(parseHexColorOrDefault('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for 8-digit hex with alpha', () => {
    expect(parseHexColorOrDefault('#ff000080')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for empty string', () => {
    expect(parseHexColorOrDefault('')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns white for non-hex characters', () => {
    expect(parseHexColorOrDefault('#gggggg')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('calculateDistance', () => {
  it('calculates distance between two points', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBeCloseTo(5, 10);
  });

  it('returns 0 for identical points', () => {
    expect(calculateDistance(5, 5, 5, 5)).toBe(0);
  });

  it('calculates horizontal distance', () => {
    expect(calculateDistance(0, 0, 10, 0)).toBeCloseTo(10, 10);
  });

  it('calculates vertical distance', () => {
    expect(calculateDistance(0, 0, 0, 10)).toBeCloseTo(10, 10);
  });

  it('handles negative coordinates', () => {
    expect(calculateDistance(-3, -4, 0, 0)).toBeCloseTo(5, 10);
  });

  it('handles large distances', () => {
    expect(calculateDistance(0, 0, 300, 400)).toBeCloseTo(500, 10);
  });
});

describe('randomRange', () => {
  it('returns a value within [min, max)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomRange(10, 20)).toBe(10);

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(randomRange(10, 20)).toBeCloseTo(19.99, 1);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomRange(10, 20)).toBeCloseTo(15, 0);

    vi.spyOn(Math, 'random').mockRestore();
  });

  it('returns min when min equals max', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomRange(5, 5)).toBe(5);
    vi.spyOn(Math, 'random').mockRestore();
  });

  it('works with negative ranges', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomRange(-20, -10)).toBeCloseTo(-15, 0);
    vi.spyOn(Math, 'random').mockRestore();
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('clamps to min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('clamps to max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('works with negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it('returns min when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
    expect(clamp(1, 3, 3)).toBe(3);
    expect(clamp(10, 3, 3)).toBe(3);
  });

  it('works with floating point values', () => {
    expect(clamp(0.5, 0, 1)).toBeCloseTo(0.5, 10);
    expect(clamp(-0.1, 0, 1)).toBe(0);
    expect(clamp(1.1, 0, 1)).toBe(1);
  });
});

describe('getOrCreateCell', () => {
  it('creates a new cell when none exists', () => {
    const cells: CellGrid = {};
    const result = getOrCreateCell(cells, 0, 0);
    expect(result).toEqual([]);
    expect(cells['0']['0']).toEqual([]);
  });

  it('returns existing cell when it exists', () => {
    const cells: CellGrid = { '1': { '2': [makeStar()] } };
    const result = getOrCreateCell(cells, 1, 2);
    expect(result).toHaveLength(1);
  });

  it('creates nested structure for new Y key in existing X key', () => {
    const cells: CellGrid = { '1': { '2': [] } };
    const result = getOrCreateCell(cells, 1, 3);
    expect(result).toEqual([]);
    expect(cells['1']['3']).toEqual([]);
    expect(cells['1']['2']).toEqual([]);
  });

  it('handles negative cell coordinates', () => {
    const cells: CellGrid = {};
    const result = getOrCreateCell(cells, -1, -2);
    expect(result).toEqual([]);
    expect(cells['-1']['-2']).toEqual([]);
  });
});

describe('calculateConnectionOpacity', () => {
  it('returns linkOpacity when distance is 0', () => {
    expect(calculateConnectionOpacity(0, 100, 0.5)).toBeCloseTo(0.5, 10);
  });

  it('returns 0 when distance equals maxDistance', () => {
    expect(calculateConnectionOpacity(100, 100, 0.5)).toBeCloseTo(0, 10);
  });

  it('scales opacity linearly with distance', () => {
    expect(calculateConnectionOpacity(50, 100, 0.5)).toBeCloseTo(0.25, 10);
    expect(calculateConnectionOpacity(75, 100, 0.8)).toBeCloseTo(0.2, 10);
  });

  it('returns negative opacity when distance exceeds maxDistance', () => {
    expect(calculateConnectionOpacity(150, 100, 0.5)).toBeCloseTo(-0.25, 10);
  });

  it('works with different linkOpacity values', () => {
    expect(calculateConnectionOpacity(0, 200, 1)).toBeCloseTo(1, 10);
    expect(calculateConnectionOpacity(100, 200, 1)).toBeCloseTo(0.5, 10);
    expect(calculateConnectionOpacity(0, 200, 0.3)).toBeCloseTo(0.3, 10);
  });
});

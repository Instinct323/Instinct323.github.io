export const DPR_CAP = 2;
export const IDLE_RESTART_TIME = 1000;
export const STAR_POINTS = 5;

export const starDensities: Record<string, number> = {
  low: 0.00005,
  medium: 0.0001,
  high: 0.0002,
  ultra: 0.0004,
};

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  shape: 'circle' | 'star';
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  depth: number;
  canConnect: boolean;
  originalX: number;
  originalY: number;
}

export type CellGrid = Record<string, Record<string, Star[]>>;

/** Throws if `color` is not a six-digit `#RRGGBB` hex string. */
export function parseHexColor(color: string): RgbColor {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`Invalid hex color: "${color}". Expected #RRGGBB.`);
  }

  return {
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
  };
}

export function calculateDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export { clamp } from '~/core/utils/clamp';

/** Mutates the grid in place, creating empty row and column arrays on demand so spatial lookup never hits undefined. */
export function getOrCreateCell(cells: CellGrid, cellX: number, cellY: number): Star[] {
  const cellXKey = String(cellX);
  const cellYKey = String(cellY);

  if (!cells[cellXKey]) {
    cells[cellXKey] = {};
  }
  if (!cells[cellXKey][cellYKey]) {
    cells[cellXKey][cellYKey] = [];
  }

  return cells[cellXKey][cellYKey];
}

/** Opacity decreases linearly as distance approaches maxDistance. */
export function calculateConnectionOpacity(
  distance: number,
  maxDistance: number,
  linkOpacity: number,
): number {
  return ((maxDistance - distance) / maxDistance) * linkOpacity;
}

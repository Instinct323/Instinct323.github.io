/**
 * Clamps a number to the inclusive `[min, max]` range.
 *
 * @param value - The number to clamp.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive).
 * @returns `min` if `value < min`, `max` if `value > max`, otherwise `value`.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

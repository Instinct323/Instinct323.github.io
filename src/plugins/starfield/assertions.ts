/**
 * Starfield plugin internal assertions.
 * Duplicated from src/lib/utils/assertions.ts so the plugin remains self-contained.
 */

export function assertFiniteNumber(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid ${key} (must be a number)`);
  }
  return value;
}

export function assertBoolean(value: unknown, key: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Missing or invalid ${key} (must be a boolean)`);
  }
  return value;
}

export function assertString(value: unknown, key: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing or invalid ${key} (must be a non-empty string)`);
  }
  return value.trim();
}

export function assertObject<T extends object = Record<string, unknown>>(
  value: unknown,
  key: string,
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Missing or invalid ${key} configuration object`);
  }
  return value as T;
}

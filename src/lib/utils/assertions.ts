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

export function assertPositiveInteger(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${key}: expected a positive integer, received ${String(value)}.`);
  }

  return value;
}

export function assertPositiveIntegerArray(values: unknown, key: string): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Missing or invalid ${key} (must be a non-empty array of positive integers)`);
  }

  return values.map((value, index) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error(`Missing or invalid ${key}[${index}] (must be a positive integer, received ${String(value)})`);
    }
    return value;
  });
}

export function assertObject<T extends object = Record<string, unknown>>(value: unknown, key: string): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Missing or invalid ${key} configuration object`);
  }

  return value as T;
}

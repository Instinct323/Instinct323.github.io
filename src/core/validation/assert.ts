/** Asserts value is a finite number and returns it. @throws when value is not a finite number. */
export function assertFiniteNumber(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid ${key} (must be a number)`);
  }

  return value;
}

/** Asserts value is a boolean and returns it. @throws when value is not a boolean. */
export function assertBoolean(value: unknown, key: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Missing or invalid ${key} (must be a boolean)`);
  }

  return value;
}

/** Asserts value is a non-empty string and returns the trimmed value. @throws when value is not a non-empty string. */
export function assertString(value: unknown, key: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing or invalid ${key} (must be a non-empty string)`);
  }

  return value.trim();
}

/** Asserts value is a positive integer and returns it. @throws when value is not a positive integer. */
export function assertPositiveInteger(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${key}: expected a positive integer, received ${String(value)}.`);
  }

  return value;
}

/**
 * Asserts value is a non-empty array of positive integers and returns the validated array.
 * @throws when value is not a non-empty array, or any element is not a positive integer.
 */
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

/**
 * Asserts value is a plain object (not array, not null) and returns it cast to `T`.
 * @throws when value is not a non-null, non-array object.
 */
export function assertObject<T extends object = Record<string, unknown>>(value: unknown, key: string): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Missing or invalid ${key} configuration object`);
  }

  return value as T;
}

/** Asserts value is a positive finite number (e.g. a scale factor) and returns it. @throws when value is not a positive finite number. */
export function assertPositiveScale(value: unknown, key: string): number {
  const num = assertFiniteNumber(value, key);
  if (num <= 0) {
    throw new Error(`Invalid ${key}: expected a positive number.`);
  }
  return num;
}

/**
 * Matches `value` against `pattern`, parses the first capture group as a finite number.
 * @returns the parsed number plus the full regex match array (so callers can read other capture groups).
 * @throws `errorMessage` when the value does not match or the captured numeric is not finite.
 */
export function parseNumericMatch(
  value: string,
  pattern: RegExp,
  errorMessage: string,
): { numeric: number; match: RegExpMatchArray } {
  const match = value.match(pattern);
  if (!match) {
    throw new Error(errorMessage);
  }

  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) {
    throw new Error(errorMessage);
  }

  return { numeric, match };
}

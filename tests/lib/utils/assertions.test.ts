import { describe, expect, it } from 'vitest';
import {
  assertFiniteNumber,
  assertBoolean,
  assertString,
  assertPositiveInteger,
  assertObject,
} from '~/core/validation/assert';

describe('assertFiniteNumber', () => {
  it('passes with a valid finite number', () => {
    expect(assertFiniteNumber(42, 'count')).toBe(42);
    expect(assertFiniteNumber(0, 'zero')).toBe(0);
    expect(assertFiniteNumber(-3.14, 'negative')).toBe(-3.14);
  });

  it('throws for NaN', () => {
    expect(() => assertFiniteNumber(NaN, 'value')).toThrow('Missing or invalid value (must be a number)');
  });

  it('throws for Infinity', () => {
    expect(() => assertFiniteNumber(Infinity, 'value')).toThrow('Missing or invalid value (must be a number)');
    expect(() => assertFiniteNumber(-Infinity, 'value')).toThrow('Missing or invalid value (must be a number)');
  });

  it('throws for non-number types', () => {
    expect(() => assertFiniteNumber('42', 'value')).toThrow('Missing or invalid value (must be a number)');
    expect(() => assertFiniteNumber(null, 'value')).toThrow('Missing or invalid value (must be a number)');
    expect(() => assertFiniteNumber(undefined, 'value')).toThrow('Missing or invalid value (must be a number)');
  });
});

describe('assertBoolean', () => {
  it('passes with a valid boolean', () => {
    expect(assertBoolean(true, 'enabled')).toBe(true);
    expect(assertBoolean(false, 'enabled')).toBe(false);
  });

  it('throws for non-boolean types', () => {
    expect(() => assertBoolean(1, 'flag')).toThrow('Missing or invalid flag (must be a boolean)');
    expect(() => assertBoolean(0, 'flag')).toThrow('Missing or invalid flag (must be a boolean)');
    expect(() => assertBoolean('true', 'flag')).toThrow('Missing or invalid flag (must be a boolean)');
    expect(() => assertBoolean(null, 'flag')).toThrow('Missing or invalid flag (must be a boolean)');
    expect(() => assertBoolean(undefined, 'flag')).toThrow('Missing or invalid flag (must be a boolean)');
  });
});

describe('assertString', () => {
  it('passes with a valid non-empty string', () => {
    expect(assertString('hello', 'name')).toBe('hello');
    expect(assertString('  trimmed  ', 'name')).toBe('trimmed');
  });

  it('throws for empty or whitespace-only strings', () => {
    expect(() => assertString('', 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString('   ', 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString('\t', 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString('\n', 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
  });

  it('throws for non-string types', () => {
    expect(() => assertString(42, 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString(null, 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString(undefined, 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
    expect(() => assertString({}, 'name')).toThrow('Missing or invalid name (must be a non-empty string)');
  });

  it('trims whitespace from valid strings', () => {
    expect(assertString('  hello  ', 'greeting')).toBe('hello');
    expect(assertString('\tworld\n', 'greeting')).toBe('world');
  });
});

describe('assertPositiveInteger', () => {
  it('passes with a valid positive integer', () => {
    expect(assertPositiveInteger(1, 'count')).toBe(1);
    expect(assertPositiveInteger(100, 'count')).toBe(100);
  });

  it('throws for zero', () => {
    expect(() => assertPositiveInteger(0, 'count')).toThrow('Invalid count: expected a positive integer, received 0.');
  });

  it('throws for negative numbers', () => {
    expect(() => assertPositiveInteger(-1, 'count')).toThrow('Invalid count: expected a positive integer, received -1.');
  });

  it('throws for non-integer numbers', () => {
    expect(() => assertPositiveInteger(1.5, 'count')).toThrow('Invalid count: expected a positive integer, received 1.5.');
  });

  it('throws for non-number types', () => {
    expect(() => assertPositiveInteger('1', 'count')).toThrow('Invalid count: expected a positive integer, received 1.');
    expect(() => assertPositiveInteger(null, 'count')).toThrow('Invalid count: expected a positive integer, received null.');
  });
});

describe('assertObject', () => {
  it('passes with a valid plain object', () => {
    const obj = { a: 1, b: 2 };
    expect(assertObject(obj, 'config')).toBe(obj);
  });

  it('passes with an empty object', () => {
    expect(assertObject({}, 'config')).toEqual({});
  });

  it('passes with nested objects', () => {
    const nested = { a: { b: { c: 1 } } };
    expect(assertObject(nested, 'config')).toBe(nested);
  });

  it('throws for null', () => {
    expect(() => assertObject(null, 'config')).toThrow('Missing or invalid config configuration object');
  });

  it('throws for arrays', () => {
    expect(() => assertObject([1, 2, 3], 'config')).toThrow('Missing or invalid config configuration object');
    expect(() => assertObject([], 'config')).toThrow('Missing or invalid config configuration object');
  });

  it('throws for non-object types', () => {
    expect(() => assertObject('string', 'config')).toThrow('Missing or invalid config configuration object');
    expect(() => assertObject(42, 'config')).toThrow('Missing or invalid config configuration object');
    expect(() => assertObject(true, 'config')).toThrow('Missing or invalid config configuration object');
    expect(() => assertObject(undefined, 'config')).toThrow('Missing or invalid config configuration object');
  });
});
/**
 * Starfield plugin internal assertions.
 * Re-exports shared primitives from src/lib/utils/assertions.ts.
 * Error message keys already carry the `effects.starfield.` prefix via the `key` argument.
 */

export {
  assertBoolean,
  assertFiniteNumber,
  assertObject,
  assertString,
} from '../../lib/utils/assertions';
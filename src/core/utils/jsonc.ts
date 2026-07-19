import { parse, type ParseError } from 'jsonc-parser';

/**
 * `jsonc-parser` fatal error codes.
 *
 * Only these two structural errors are treated as hard failures:
 *   - 7 (InvalidSymbol): unexpected character in a value position
 *   - 8 (UnexpectedEndOfFile): EOF reached while a value was expected
 *
 * All other parser diagnostics — comments, trailing commas, etc. — are
 * intentionally tolerated because this parser is used for human-edited config.
 */
const ERROR_INVALID_SYMBOL = 7;
const ERROR_UNEXPECTED_END = 8;

const FATAL_ERROR_CODES = new Set<number>([ERROR_INVALID_SYMBOL, ERROR_UNEXPECTED_END]);

export function parseJsonc(raw: string): unknown {
  const errors: ParseError[] = [];
  const result = parse(raw, errors);
  const fatalErrors = errors.filter(
    (e) => FATAL_ERROR_CODES.has(e.error)
  );
  if (fatalErrors.length > 0) {
    const messages = fatalErrors.map((e) => `offset ${e.offset + 1}: error ${e.error}`).join('; ');
    throw new SyntaxError(`Invalid JSONC (${messages})`);
  }
  return result;
}

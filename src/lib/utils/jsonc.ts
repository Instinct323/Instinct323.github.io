import { parse, type ParseError } from 'jsonc-parser';

// Fatal error codes that indicate truly invalid JSONC
// 7 = InvalidSymbol, 8 = InvalidToken
// Others (1=PropertyNameExpected, 2=ValueExpected, etc.) are benign - parser still returns correct result
const FATAL_ERROR_CODES = new Set([7, 8]);

export function parseJsonc(raw: string): unknown {
  const errors: ParseError[] = [];
  const result = parse(raw, errors);
  const fatalErrors = errors.filter(
    (e) => FATAL_ERROR_CODES.has(e.error)
  );
  if (fatalErrors.length > 0) {
    throw new SyntaxError('Invalid JSONC');
  }
  return result;
}

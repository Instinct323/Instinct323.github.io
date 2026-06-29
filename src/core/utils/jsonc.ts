import { parse, type ParseError } from 'jsonc-parser';

// `jsonc-parser` internal error codes (see its ParseErrorCode enum).
// We treat only the two fatal structural errors as hard failures; non-fatal
// warnings (e.g. comments, trailing commas) are intentionally tolerated.
const ERROR_INVALID_SYMBOL = 7; // Unexpected character in a value position
const ERROR_UNEXPECTED_END = 8; // End of file reached while a value was expected

const FATAL_ERROR_CODES = new Set<number>([ERROR_INVALID_SYMBOL, ERROR_UNEXPECTED_END]);

export function parseJsonc(raw: string): unknown {
  const errors: ParseError[] = [];
  const result = parse(raw, errors);
  const fatalErrors = errors.filter(
    (e) => FATAL_ERROR_CODES.has(e.error)
  );
  if (fatalErrors.length > 0) {
    const messages = fatalErrors.map((e) => `line ${e.line + 1}, col ${e.offset + 1}: error ${e.error}`).join('; ');
    throw new SyntaxError(`Invalid JSONC (${messages})`);
  }
  return result;
}

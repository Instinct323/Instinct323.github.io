/**
 * Parses a JSON payload sourced from an HTML data-* attribute and routes the
 * decoded value through a validator. JSON syntax errors are re-thrown with
 * caller-provided context (e.g. the attribute name + page location) so the
 * failure message points at the right DOM slot rather than dumping a raw
 * `SyntaxError` stack.
 */
export function parseDatasetPayload<T>(
  datasetValue: string,
  validator: (_raw: unknown) => T,
  syntaxErrorContext: string,
): T {
  let raw: unknown;
  try {
    raw = JSON.parse(datasetValue);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`${syntaxErrorContext}: ${e.message}`);
    }
    throw e;
  }
  return validator(raw);
}

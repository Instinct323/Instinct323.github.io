/**
 * Parses a dataset attribute string as JSON, catches SyntaxError with context,
 * and passes the parsed result through a validator function.
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

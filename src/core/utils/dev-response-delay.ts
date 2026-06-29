export function getDevResponseDelayMs(): number {
  return import.meta.env.DEV ? import.meta.env.DEV_RESPONSE_DELAY_MS : 0;
}

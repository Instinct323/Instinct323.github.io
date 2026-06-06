/**
 * Starfield effect plugin — self-contained, drop-in background animation.
 *
 * Public API:
 *   initStarfield(canvasBg, canvasStars, config) -> cleanupFn
 *   resolveStarfieldEffectConfig(raw) -> validated StarfieldEffectConfig
 *
 * Types:
 *   StarfieldEffectConfig, SiteEffectsConfig
 */

export type { StarfieldEffectConfig, SiteEffectsConfig } from './types';
export { initStarfield } from './runtime';
export { resolveStarfieldEffectConfig } from './config';

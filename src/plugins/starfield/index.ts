/**
 * Starfield effect plugin — self-contained, drop-in background animation.
 *
 * Public API:
 *   initStarfield(canvasBg, canvasStars, config) -> cleanupFn
 *   resolveStarfieldEffectConfig(raw) -> validated StarfieldEffectConfig
 *
 * Types:
 *   StarfieldEffectConfig
 */

import { registerEffectsResolver } from '../../lib/domain/effects-resolver';
import { resolveStarfieldEffectConfig } from './config';

export type { StarfieldEffectConfig } from './types';
export { initStarfield } from './runtime';
export { resolveStarfieldEffectConfig } from './config';

registerEffectsResolver('starfield', resolveStarfieldEffectConfig);

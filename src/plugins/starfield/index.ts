/** Starfield effect plugin. */

import { registerEffectsResolver } from '../../lib/domain/effects-resolver';
import { resolveStarfieldEffectConfig } from './config';
import type { StarfieldEffectConfig } from './types';

export type { StarfieldEffectConfig } from './types';
export { initStarfield } from './bootstrap';
export { resolveStarfieldEffectConfig } from './config';

registerEffectsResolver<StarfieldEffectConfig>('starfield', resolveStarfieldEffectConfig);

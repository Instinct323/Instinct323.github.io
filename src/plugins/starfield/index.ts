/** Starfield effect plugin. */

import { registerEffectsResolver } from '../../lib/domain/effects-resolver';
import { resolveStarfieldEffectConfig } from './config';
import { initStarfield } from './bootstrap';
import type { StarfieldEffectConfig } from './types';

export type { StarfieldEffectConfig } from './types';
export { initStarfield } from './bootstrap';
export { resolveStarfieldEffectConfig } from './config';

registerEffectsResolver<StarfieldEffectConfig>('starfield', resolveStarfieldEffectConfig);

registerEffectsResolver<(_backgroundCanvas: HTMLCanvasElement, _starsCanvas: HTMLCanvasElement) => () => void>(
  'starfield-runtime',
  (config) => (backgroundCanvas, starsCanvas) => {
    const cleanup = initStarfield(backgroundCanvas, starsCanvas, config as StarfieldEffectConfig);
    return cleanup;
  },
);

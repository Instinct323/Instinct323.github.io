import type { StarfieldEffectConfig } from './types';
import { initStarfieldCore } from './runtime';

export function hideCanvases(backgroundCanvas: HTMLCanvasElement, starsCanvas: HTMLCanvasElement): void {
  backgroundCanvas.style.display = 'none';
  starsCanvas.style.display = 'none';
}

/**
 * Initializes the starfield canvas animation if enabled and motion is not reduced.
 *
 * Returns a teardown handle for hosts with remount/unmount lifecycles.
 * The current MPA layout intentionally does not retain it — the effect
 * lives for the full page lifetime and is cleaned up by navigation.
 *
 * Throws descriptive Errors on the early-skip paths so the caller can decide how
 * to degrade (e.g. hide canvases, mark the DOM, log). Callers must wrap this
 * function in a try/catch.
 */
export function initStarfield(
  backgroundCanvas: HTMLCanvasElement,
  starsCanvas: HTMLCanvasElement,
  config: StarfieldEffectConfig,
): () => void {
  if (!config.enabled) {
    throw new Error('Starfield disabled by config');
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery.matches) {
    throw new Error('Starfield skipped: prefers-reduced-motion is enabled');
  }

  const ctxBg = backgroundCanvas.getContext('2d');
  const ctxSt = starsCanvas.getContext('2d');

  if (!ctxBg || !ctxSt) {
    throw new Error('Starfield skipped: failed to acquire 2D canvas context');
  }

  return initStarfieldCore(backgroundCanvas, starsCanvas, config, ctxBg, ctxSt);
}

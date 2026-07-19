import type { StarfieldEffectConfig } from './types';
import { parseHexColor } from './utils';
import {
  assertBoolean,
  assertFiniteNumber,
  assertObject,
} from '~/core/validation/assert';

/**
 * Validates and normalizes the starfield effect configuration.
 * The canvas animation has many interdependent numeric parameters;
 * early validation prevents subtle runtime rendering bugs.
 */
export function resolveStarfieldEffectConfig(config: unknown): StarfieldEffectConfig {
  const rawConfig = assertObject<Partial<StarfieldEffectConfig>>(config, 'effects.starfield');

  const starDensity = rawConfig.starDensity;
  if (!starDensity || !['low', 'medium', 'high', 'ultra'].includes(starDensity)) {
    throw new Error('Missing or invalid effects.starfield.starDensity (must be low/medium/high/ultra)');
  }

  const starSize = rawConfig.starSize;
  const starSizeConfig = assertObject<{ min: number; max: number }>(starSize, 'effects.starfield.starSize');
  const starSizeMin = assertFiniteNumber(starSizeConfig.min, 'effects.starfield.starSize.min');
  const starSizeMax = assertFiniteNumber(starSizeConfig.max, 'effects.starfield.starSize.max');
  if (starSizeMin <= 0 || starSizeMax <= 0 || starSizeMin > starSizeMax) {
    throw new Error('Missing or invalid effects.starfield.starSize range (0 < min <= max required)');
  }

  const speedFactor = assertFiniteNumber(rawConfig.speedFactor, 'effects.starfield.speedFactor');
  if (speedFactor < 0) {
    throw new Error('Missing or invalid effects.starfield.speedFactor (must be >= 0)');
  }

  const maxDistance = assertFiniteNumber(rawConfig.maxDistance, 'effects.starfield.maxDistance');
  if (maxDistance <= 0) {
    throw new Error('Missing or invalid effects.starfield.maxDistance (must be > 0)');
  }

  const linkOpacity = assertFiniteNumber(rawConfig.linkOpacity, 'effects.starfield.linkOpacity');
  const starOpacity = assertFiniteNumber(rawConfig.starOpacity, 'effects.starfield.starOpacity');
  if (linkOpacity < 0 || linkOpacity > 1 || starOpacity < 0 || starOpacity > 1) {
    throw new Error('Missing or invalid effects.starfield opacity values (must be within [0, 1])');
  }

  const starColor = rawConfig.starColor;
  if (typeof starColor !== 'string') {
    throw new Error('Invalid effects.starfield.starColor (must be #RRGGBB)');
  }
  try {
    parseHexColor(starColor);
  } catch {
    throw new Error('Invalid effects.starfield.starColor (must be #RRGGBB)');
  }

  const starShapes = rawConfig.starShapes;
  if (!Array.isArray(starShapes) || starShapes.length === 0) {
    throw new Error('Missing or invalid effects.starfield.starShapes (must be non-empty array)');
  }
  if (!starShapes.every((shape) => shape === 'circle' || shape === 'star')) {
    throw new Error('Missing or invalid effects.starfield.starShapes (values must be circle/star)');
  }

  const parallaxEffect = assertBoolean(rawConfig.parallaxEffect, 'effects.starfield.parallaxEffect');
  const parallaxStrength = assertFiniteNumber(rawConfig.parallaxStrength, 'effects.starfield.parallaxStrength');
  if (parallaxStrength <= 0) {
    throw new Error('Missing or invalid effects.starfield.parallaxStrength (must be > 0)');
  }

  const mouseRadius = assertFiniteNumber(rawConfig.mouseRadius, 'effects.starfield.mouseRadius');
  if (mouseRadius < 0) {
    throw new Error('Missing or invalid effects.starfield.mouseRadius (must be >= 0)');
  }

  const rotationSpeed = rawConfig.rotationSpeed;
  const rotationSpeedConfig = assertObject<{ min: number; max: number }>(
    rotationSpeed,
    'effects.starfield.rotationSpeed',
  );
  const rotationSpeedMin = assertFiniteNumber(rotationSpeedConfig.min, 'effects.starfield.rotationSpeed.min');
  const rotationSpeedMax = assertFiniteNumber(rotationSpeedConfig.max, 'effects.starfield.rotationSpeed.max');
  if (rotationSpeedMin < 0 || rotationSpeedMax < 0 || rotationSpeedMin > rotationSpeedMax) {
    throw new Error('Missing or invalid effects.starfield.rotationSpeed range (0 <= min <= max required)');
  }

  const connectionsWhenNoMouse = assertBoolean(
    rawConfig.connectionsWhenNoMouse,
    'effects.starfield.connectionsWhenNoMouse',
  );
  const percentStarsConnecting = assertFiniteNumber(
    rawConfig.percentStarsConnecting,
    'effects.starfield.percentStarsConnecting',
  );
  if (percentStarsConnecting < 0 || percentStarsConnecting > 100) {
    throw new Error('Missing or invalid effects.starfield.percentStarsConnecting (must be within [0, 100])');
  }

  const lineThickness = assertFiniteNumber(rawConfig.lineThickness, 'effects.starfield.lineThickness');
  if (lineThickness <= 0) {
    throw new Error('Missing or invalid effects.starfield.lineThickness (must be > 0)');
  }

  return {
    enabled: assertBoolean(rawConfig.enabled, 'effects.starfield.enabled'),
    starDensity: starDensity as 'low' | 'medium' | 'high' | 'ultra',
    starSize: { min: starSizeMin, max: starSizeMax },
    speedFactor,
    maxDistance,
    starColor,
    starOpacity,
    linkOpacity,
    starShapes: starShapes as ('circle' | 'star')[],
    parallaxEffect,
    parallaxStrength,
    mouseRadius,
    rotationSpeed: { min: rotationSpeedMin, max: rotationSpeedMax },
    connectionsWhenNoMouse,
    percentStarsConnecting,
    lineThickness,
  };
}

import { describe, expect, it } from 'vitest';
import { resolveStarfieldEffectConfig } from '../../src/plugins/starfield';
import type { StarfieldEffectConfig } from '../../src/plugins/starfield';

describe('resolveStarfieldEffectConfig', () => {
  const validConfig: StarfieldEffectConfig = {
    enabled: true,
    starDensity: 'medium',
    starSize: { min: 1, max: 3 },
    speedFactor: 0.5,
    maxDistance: 120,
    starColor: '#ffffff',
    starOpacity: 0.8,
    linkOpacity: 0.3,
    starShapes: ['circle', 'star'],
    parallaxEffect: true,
    parallaxStrength: 0.05,
    mouseRadius: 150,
    rotationSpeed: { min: 0.1, max: 0.5 },
    connectionsWhenNoMouse: false,
    percentStarsConnecting: 50,
    lineThickness: 1,
  };

  it('returns complete config object with valid input', () => {
    const result = resolveStarfieldEffectConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  it('accepts all valid starDensity values', () => {
    const densities: Array<'low' | 'medium' | 'high' | 'ultra'> = ['low', 'medium', 'high', 'ultra'];

    densities.forEach((density) => {
      const config = { ...validConfig, starDensity: density };
      const result = resolveStarfieldEffectConfig(config);
      expect(result.starDensity).toBe(density);
    });
  });

  it('throws when starDensity is missing', () => {
    const configWithoutStarDensity = {
      ...validConfig,
      starDensity: undefined,
    };

    expect(() => resolveStarfieldEffectConfig(configWithoutStarDensity)).toThrow(
      'Missing or invalid effects.starfield.starDensity (must be low/medium/high/ultra)',
    );
  });

  it('throws when starDensity is invalid value', () => {
    const configWithInvalidDensity = {
      ...validConfig,
      starDensity: 'invalid',
    };

    expect(() => resolveStarfieldEffectConfig(configWithInvalidDensity)).toThrow(
      'Missing or invalid effects.starfield.starDensity (must be low/medium/high/ultra)',
    );
  });

  it('throws when starSize.min > starSize.max', () => {
    const configWithInvalidRange = {
      ...validConfig,
      starSize: { min: 5, max: 3 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithInvalidRange)).toThrow(
      'Missing or invalid effects.starfield.starSize range (0 < min <= max required)',
    );
  });

  it('throws when starSize.min is zero or negative', () => {
    const configWithZeroMin = {
      ...validConfig,
      starSize: { min: 0, max: 3 },
    };
    const configWithNegativeMin = {
      ...validConfig,
      starSize: { min: -1, max: 3 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithZeroMin)).toThrow(
      'Missing or invalid effects.starfield.starSize range (0 < min <= max required)',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativeMin)).toThrow(
      'Missing or invalid effects.starfield.starSize range (0 < min <= max required)',
    );
  });

  it('throws when starSize.max is zero or negative', () => {
    const configWithZeroMax = {
      ...validConfig,
      starSize: { min: 1, max: 0 },
    };
    const configWithNegativeMax = {
      ...validConfig,
      starSize: { min: 1, max: -1 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithZeroMax)).toThrow(
      'Missing or invalid effects.starfield.starSize range (0 < min <= max required)',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativeMax)).toThrow(
      'Missing or invalid effects.starfield.starSize range (0 < min <= max required)',
    );
  });

  it('throws when starOpacity is out of [0, 1] range', () => {
    const configWithHighOpacity = {
      ...validConfig,
      starOpacity: 1.5,
    };
    const configWithLowOpacity = {
      ...validConfig,
      starOpacity: -0.5,
    };

    expect(() => resolveStarfieldEffectConfig(configWithHighOpacity)).toThrow(
      'Missing or invalid effects.starfield opacity values (must be within [0, 1])',
    );
    expect(() => resolveStarfieldEffectConfig(configWithLowOpacity)).toThrow(
      'Missing or invalid effects.starfield opacity values (must be within [0, 1])',
    );
  });

  it('throws when linkOpacity is out of [0, 1] range', () => {
    const configWithHighLinkOpacity = {
      ...validConfig,
      linkOpacity: 1.5,
    };
    const configWithLowLinkOpacity = {
      ...validConfig,
      linkOpacity: -0.5,
    };

    expect(() => resolveStarfieldEffectConfig(configWithHighLinkOpacity)).toThrow(
      'Missing or invalid effects.starfield opacity values (must be within [0, 1])',
    );
    expect(() => resolveStarfieldEffectConfig(configWithLowLinkOpacity)).toThrow(
      'Missing or invalid effects.starfield opacity values (must be within [0, 1])',
    );
  });

  it('throws when speedFactor is negative', () => {
    const configWithNegativeSpeed = {
      ...validConfig,
      speedFactor: -0.5,
    };

    expect(() => resolveStarfieldEffectConfig(configWithNegativeSpeed)).toThrow(
      'Missing or invalid effects.starfield.speedFactor (must be >= 0)',
    );
  });

  it('throws when maxDistance is zero or negative', () => {
    const configWithZeroMaxDistance = {
      ...validConfig,
      maxDistance: 0,
    };
    const configWithNegativeMaxDistance = {
      ...validConfig,
      maxDistance: -10,
    };

    expect(() => resolveStarfieldEffectConfig(configWithZeroMaxDistance)).toThrow(
      'Missing or invalid effects.starfield.maxDistance (must be > 0)',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativeMaxDistance)).toThrow(
      'Missing or invalid effects.starfield.maxDistance (must be > 0)',
    );
  });

  it('throws when parallaxStrength is zero or negative', () => {
    const configWithZeroParallax = {
      ...validConfig,
      parallaxStrength: 0,
    };
    const configWithNegativeParallax = {
      ...validConfig,
      parallaxStrength: -0.05,
    };

    expect(() => resolveStarfieldEffectConfig(configWithZeroParallax)).toThrow(
      'Missing or invalid effects.starfield.parallaxStrength (must be > 0)',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativeParallax)).toThrow(
      'Missing or invalid effects.starfield.parallaxStrength (must be > 0)',
    );
  });

  it('throws when mouseRadius is negative', () => {
    const configWithNegativeMouseRadius = {
      ...validConfig,
      mouseRadius: -50,
    };

    expect(() => resolveStarfieldEffectConfig(configWithNegativeMouseRadius)).toThrow(
      'Missing or invalid effects.starfield.mouseRadius (must be >= 0)',
    );
  });

  it('throws when rotationSpeed.min > rotationSpeed.max', () => {
    const configWithInvalidRotationRange = {
      ...validConfig,
      rotationSpeed: { min: 1.0, max: 0.5 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithInvalidRotationRange)).toThrow(
      'Missing or invalid effects.starfield.rotationSpeed range (0 <= min <= max required)',
    );
  });

  it('throws when rotationSpeed.min is negative', () => {
    const configWithNegativeRotationMin = {
      ...validConfig,
      rotationSpeed: { min: -0.1, max: 0.5 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithNegativeRotationMin)).toThrow(
      'Missing or invalid effects.starfield.rotationSpeed range (0 <= min <= max required)',
    );
  });

  it('throws when rotationSpeed.max is negative', () => {
    const configWithNegativeRotationMax = {
      ...validConfig,
      rotationSpeed: { min: 0.1, max: -0.5 },
    };

    expect(() => resolveStarfieldEffectConfig(configWithNegativeRotationMax)).toThrow(
      'Missing or invalid effects.starfield.rotationSpeed range (0 <= min <= max required)',
    );
  });

  it('throws when percentStarsConnecting is out of [0, 100] range', () => {
    const configWithHighPercent = {
      ...validConfig,
      percentStarsConnecting: 150,
    };
    const configWithNegativePercent = {
      ...validConfig,
      percentStarsConnecting: -10,
    };

    expect(() => resolveStarfieldEffectConfig(configWithHighPercent)).toThrow(
      'Missing or invalid effects.starfield.percentStarsConnecting (must be within [0, 100])',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativePercent)).toThrow(
      'Missing or invalid effects.starfield.percentStarsConnecting (must be within [0, 100])',
    );
  });

  it('throws when lineThickness is zero or negative', () => {
    const configWithZeroThickness = {
      ...validConfig,
      lineThickness: 0,
    };
    const configWithNegativeThickness = {
      ...validConfig,
      lineThickness: -1,
    };

    expect(() => resolveStarfieldEffectConfig(configWithZeroThickness)).toThrow(
      'Missing or invalid effects.starfield.lineThickness (must be > 0)',
    );
    expect(() => resolveStarfieldEffectConfig(configWithNegativeThickness)).toThrow(
      'Missing or invalid effects.starfield.lineThickness (must be > 0)',
    );
  });

  it('throws when starShapes is not an array', () => {
    const configWithInvalidShapes = {
      ...validConfig,
      starShapes: 'circle',
    };

    expect(() => resolveStarfieldEffectConfig(configWithInvalidShapes)).toThrow(
      'Missing or invalid effects.starfield.starShapes (must be non-empty array)',
    );
  });

  it('throws when starShapes is empty array', () => {
    const configWithEmptyShapes = {
      ...validConfig,
      starShapes: [],
    };

    expect(() => resolveStarfieldEffectConfig(configWithEmptyShapes)).toThrow(
      'Missing or invalid effects.starfield.starShapes (must be non-empty array)',
    );
  });

  it('throws when starShapes contains invalid values', () => {
    const configWithInvalidShape = {
      ...validConfig,
      starShapes: ['circle', 'invalid'],
    };

    expect(() => resolveStarfieldEffectConfig(configWithInvalidShape)).toThrow(
      'Missing or invalid effects.starfield.starShapes (values must be circle/star)',
    );
  });

  it('throws when config is not an object', () => {
    expect(() => resolveStarfieldEffectConfig(null)).toThrow(
      'Missing or invalid effects.starfield configuration object',
    );
    expect(() => resolveStarfieldEffectConfig('string')).toThrow(
      'Missing or invalid effects.starfield configuration object',
    );
    expect(() => resolveStarfieldEffectConfig(42)).toThrow(
      'Missing or invalid effects.starfield configuration object',
    );
  });

  it('throws when config is an array', () => {
    expect(() => resolveStarfieldEffectConfig([validConfig])).toThrow(
      'Missing or invalid effects.starfield configuration object',
    );
  });
});

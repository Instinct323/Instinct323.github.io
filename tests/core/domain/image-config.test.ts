import { describe, expect, it } from 'vitest';
import {
  resolveSiteImageConfig,
  resolveImageLazyLoadConfig,
  resolveImagePlaceholderEffectConfig,
} from '~/features/site/image-config-resolver';
import type { SiteImageConfig } from '~/features/site/image-config';

describe('resolveSiteImageConfig', () => {
  const validConfig: SiteImageConfig = {
    format: 'webp',
    quality: 85,
    widths: {
      medium: [400, 600, 800],
      high: [800, 1200, 1600],
    },
    dprScale: {
      low: 1,
      medium: 1.5,
      high: 2,
    },
    lazyLoad: {
      rootMargin: '200px',
    },
    placeholderEffect: 'ring-quarter-fast',
  };

  it('returns complete config object with valid input', () => {
    const result = resolveSiteImageConfig(validConfig);

    expect(result).toEqual(validConfig);
  });

  it('throws when format is missing', () => {
    const configWithoutFormat = {
      ...validConfig,
      format: undefined,
    };

    expect(() => resolveSiteImageConfig(configWithoutFormat)).toThrow(
      'Missing or invalid image.format (must be a non-empty string)'
    );
  });

  it('throws when format is invalid', () => {
    const configWithInvalidFormat = {
      ...validConfig,
      format: '',
    };

    expect(() => resolveSiteImageConfig(configWithInvalidFormat)).toThrow(
      'Missing or invalid image.format (must be a non-empty string)'
    );
  });

  it('throws when quality is out of [1, 100] range', () => {
    const configWithHighQuality = {
      ...validConfig,
      quality: 150,
    };
    const configWithLowQuality = {
      ...validConfig,
      quality: 0,
    };
    expect(() => resolveSiteImageConfig(configWithHighQuality)).toThrow(
      'Missing or invalid image.quality (must be an integer in [1, 100])'
    );
    expect(() => resolveSiteImageConfig(configWithLowQuality)).toThrow(
      'Missing or invalid image.quality (must be an integer in [1, 100])'
    );
  });

  it('throws when quality is not an integer', () => {
    const configWithFloatQuality = {
      ...validConfig,
      quality: 85.5,
    };

    expect(() => resolveSiteImageConfig(configWithFloatQuality)).toThrow(
      'Missing or invalid image.quality (must be an integer in [1, 100])'
    );
  });

  it('throws when widths.medium is empty', () => {
    const configWithEmptyMedium = {
      ...validConfig,
      widths: {
        medium: [],
        high: [800, 1200, 1600],
      },
    };

    expect(() => resolveSiteImageConfig(configWithEmptyMedium)).toThrow(
      'Missing or invalid image.widths.medium (must be a non-empty array of positive integers)'
    );
  });

  it('throws when widths.high is empty', () => {
    const configWithEmptyHigh = {
      ...validConfig,
      widths: {
        medium: [400, 600, 800],
        high: [],
      },
    };

    expect(() => resolveSiteImageConfig(configWithEmptyHigh)).toThrow(
      'Missing or invalid image.widths.high (must be a non-empty array of positive integers)'
    );
  });

  it('throws when widths contains non-positive integers', () => {
    const configWithZeroWidth = {
      ...validConfig,
      widths: {
        medium: [0, 600, 800],
        high: [800, 1200, 1600],
      },
    };
    const configWithNegativeWidth = {
      ...validConfig,
      widths: {
        medium: [-100, 600, 800],
        high: [800, 1200, 1600],
      },
    };
    const configWithFloatWidth = {
      ...validConfig,
      widths: {
        medium: [400.5, 600, 800],
        high: [800, 1200, 1600],
      },
    };

    expect(() => resolveSiteImageConfig(configWithZeroWidth)).toThrow(
      'Missing or invalid image.widths.medium[0] (must be a positive integer, received 0)'
    );
    expect(() => resolveSiteImageConfig(configWithNegativeWidth)).toThrow(
      'Missing or invalid image.widths.medium[0] (must be a positive integer, received -100)'
    );
    expect(() => resolveSiteImageConfig(configWithFloatWidth)).toThrow(
      'Missing or invalid image.widths.medium[0] (must be a positive integer, received 400.5)'
    );
  });

  it('throws when dprScale values are not positive', () => {
    const configWithZeroDpr = {
      ...validConfig,
      dprScale: {
        low: 0,
        medium: 1.5,
        high: 2,
      },
    };
    const configWithNegativeDpr = {
      ...validConfig,
      dprScale: {
        low: -1,
        medium: 1.5,
        high: 2,
      },
    };

    expect(() => resolveSiteImageConfig(configWithZeroDpr)).toThrow(
      'Missing or invalid image.dprScale values (must be > 0)'
    );
    expect(() => resolveSiteImageConfig(configWithNegativeDpr)).toThrow(
      'Missing or invalid image.dprScale values (must be > 0)'
    );
  });
});

describe('resolveImageLazyLoadConfig', () => {
  const validLazyLoadConfig = {
    rootMargin: '200px',
  };

  it('returns lazyLoad config with valid input', () => {
    const result = resolveImageLazyLoadConfig(validLazyLoadConfig);

    expect(result).toEqual({
      rootMargin: '200px',
    });
  });

  it('throws when rootMargin is missing', () => {
    const configWithoutRootMargin = {};

    expect(() => resolveImageLazyLoadConfig(configWithoutRootMargin)).toThrow(
      'Missing or invalid image.lazyLoad.rootMargin (must be a non-empty string)'
    );
  });
});

describe('resolveImagePlaceholderEffectConfig', () => {
  it('accepts valid effect names', () => {
    const validEffects = [
      'ring-quarter-fast',
      'single-arc-rotate',
      'half-ring-rotate',
      'bars-scale-y',
      'bars-drop-loop',
      'bars-height-wave',
      'bars-opacity-step',
      'bars-opacity-height',
    ];

    validEffects.forEach((effect) => {
      const result = resolveImagePlaceholderEffectConfig(effect);
      expect(result).toBe(effect);
    });
  });

  it('throws for invalid effect names', () => {
    expect(() => resolveImagePlaceholderEffectConfig('invalid')).toThrow(
      'Missing or invalid image.placeholderEffect (must be one of: ring-quarter-fast, single-arc-rotate, half-ring-rotate, bars-scale-y, bars-drop-loop, bars-height-wave, bars-opacity-step, bars-opacity-height)'
    );
  });

  it('throws for non-string values', () => {
    expect(() => resolveImagePlaceholderEffectConfig(123)).toThrow(
      'Missing or invalid image.placeholderEffect (must be a non-empty string)'
    );
    expect(() => resolveImagePlaceholderEffectConfig(null)).toThrow(
      'Missing or invalid image.placeholderEffect (must be a non-empty string)'
    );
  });

  it('throws for empty string', () => {
    expect(() => resolveImagePlaceholderEffectConfig('')).toThrow(
      'Missing or invalid image.placeholderEffect (must be a non-empty string)'
    );
  });
});

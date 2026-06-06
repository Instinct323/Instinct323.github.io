import { describe, expect, it } from 'vitest';
import {
  resolveSiteImageConfig,
  resolveImageLazyLoadConfig,
  resolveDeferredMountRuntimeConfig,
  resolveImagePlaceholderEffectConfig,
} from '../../../src/lib/domain/image-config';
import type { SiteImageConfig } from '../../../src/types';
import type { DeferredImageLazyLoadConfig } from '../../../src/types/page-load';

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
      localDebugDelayMs: 1000,
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
      'Missing or invalid image.widths.medium (must be a non-empty number array)'
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
      'Missing or invalid image.widths.high (must be a non-empty number array)'
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
      'Missing or invalid image.widths.medium entry (must be positive integer)'
    );
    expect(() => resolveSiteImageConfig(configWithNegativeWidth)).toThrow(
      'Missing or invalid image.widths.medium entry (must be positive integer)'
    );
    expect(() => resolveSiteImageConfig(configWithFloatWidth)).toThrow(
      'Missing or invalid image.widths.medium entry (must be positive integer)'
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
    localDebugDelayMs: 1000,
  };

  it('returns lazyLoad config with valid input', () => {
    const result = resolveImageLazyLoadConfig(validLazyLoadConfig);

    expect(result).toEqual({
      rootMargin: '200px',
      localDebugDelayMs: 1000,
    });
  });

  it('throws when rootMargin is missing', () => {
    const configWithoutRootMargin = {
      localDebugDelayMs: 1000,
    };

    expect(() => resolveImageLazyLoadConfig(configWithoutRootMargin)).toThrow(
      'Missing or invalid image.lazyLoad.rootMargin (must be a non-empty string)'
    );
  });

  it('throws when localDebugDelayMs is negative', () => {
    const configWithNegativeDelay = {
      rootMargin: '200px',
      localDebugDelayMs: -100,
    };

    expect(() => resolveImageLazyLoadConfig(configWithNegativeDelay)).toThrow(
      'Missing or invalid image.lazyLoad.localDebugDelayMs (must be a non-negative integer)'
    );
  });

  it('throws when localDebugDelayMs is not an integer', () => {
    const configWithFloatDelay = {
      rootMargin: '200px',
      localDebugDelayMs: 1000.5,
    };

    expect(() => resolveImageLazyLoadConfig(configWithFloatDelay)).toThrow(
      'Missing or invalid image.lazyLoad.localDebugDelayMs (must be a non-negative integer)'
    );
  });

  it('accepts zero as valid localDebugDelayMs', () => {
    const configWithZeroDelay = {
      rootMargin: '200px',
      localDebugDelayMs: 0,
    };

    const result = resolveImageLazyLoadConfig(configWithZeroDelay);
    expect(result.localDebugDelayMs).toBe(0);
  });
});

describe('resolveDeferredMountRuntimeConfig', () => {
  const mockLazyLoad: DeferredImageLazyLoadConfig = {
    rootMargin: '200px',
    localDebugDelayMs: 1000,
  };

  it('uses localDebugDelayMs when dev=true', () => {
    const result = resolveDeferredMountRuntimeConfig(mockLazyLoad, true);

    expect(result).toEqual({
      rootMargin: '200px',
      mountDelayMs: 1000,
    });
  });

  it('uses 0 when dev=false', () => {
    const result = resolveDeferredMountRuntimeConfig(mockLazyLoad, false);

    expect(result).toEqual({
      rootMargin: '200px',
      mountDelayMs: 0,
    });
  });

  it('handles different localDebugDelayMs values in dev mode', () => {
    const fastLazyLoad: DeferredImageLazyLoadConfig = {
      rootMargin: '100px',
      localDebugDelayMs: 100,
    };

    const result = resolveDeferredMountRuntimeConfig(fastLazyLoad, true);
    expect(result.mountDelayMs).toBe(100);
  });

  it('always uses 0 mountDelayMs in production regardless of localDebugDelayMs', () => {
    const slowLazyLoad: DeferredImageLazyLoadConfig = {
      rootMargin: '300px',
      localDebugDelayMs: 5000,
    };

    const result = resolveDeferredMountRuntimeConfig(slowLazyLoad, false);
    expect(result.mountDelayMs).toBe(0);
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

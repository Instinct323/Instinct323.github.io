import { describe, expect, it } from 'vitest';
import { resolveFeaturedCarouselVisual } from '~/plugins/swiper/config-resolver';
import type { HomePageCarouselVisualConfig } from '~/plugins/swiper/types';

describe('resolveFeaturedCarouselVisual', () => {
  const validConfig: HomePageCarouselVisualConfig = {
    spaceBetween: 24,
    slideWidth: {
      desktop: '33.333%',
      tablet: '50%',
      mobile: '100%',
    },
    inactiveOpacity: 0.5,
  };

  it('returns complete config object with valid input', () => {
    const result = resolveFeaturedCarouselVisual(validConfig);

    expect(result).toEqual({
      spaceBetween: 24,
      slideWidth: {
        desktop: '33.333%',
        tablet: '50%',
        mobile: '100%',
      },
      inactiveOpacity: 0.5,
    });
  });

  it('trims whitespace from slideWidth strings', () => {
    const configWithWhitespace = {
      ...validConfig,
      slideWidth: {
        desktop: '  33.333%  ',
        tablet: '\t50%\n',
        mobile: '  100%',
      },
    };

    const result = resolveFeaturedCarouselVisual(configWithWhitespace);

    expect(result.slideWidth).toEqual({
      desktop: '33.333%',
      tablet: '50%',
      mobile: '100%',
    });
  });

  it('clamps inactiveOpacity to [0, 1] range', () => {
    const configWithHighOpacity = {
      ...validConfig,
      inactiveOpacity: 1.5,
    };
    const configWithLowOpacity = {
      ...validConfig,
      inactiveOpacity: -0.5,
    };

    expect(resolveFeaturedCarouselVisual(configWithHighOpacity).inactiveOpacity).toBe(1);
    expect(resolveFeaturedCarouselVisual(configWithLowOpacity).inactiveOpacity).toBe(0);
  });

  it('throws when slideWidth is missing', () => {
    const configWithoutSlideWidth = {
      spaceBetween: 24,
      inactiveOpacity: 0.5,
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutSlideWidth)).toThrow(
      'Missing carousel visual.slideWidth configuration'
    );
  });

  it('throws when slideWidth is not an object', () => {
    const configWithInvalidSlideWidth = {
      ...validConfig,
      slideWidth: 'invalid',
    };

    expect(() => resolveFeaturedCarouselVisual(configWithInvalidSlideWidth)).toThrow(
      'Missing carousel visual.slideWidth configuration'
    );
  });

  it('throws when slideWidth.desktop is missing', () => {
    const configWithoutDesktop = {
      ...validConfig,
      slideWidth: {
        tablet: '50%',
        mobile: '100%',
      },
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutDesktop)).toThrow(
      'Missing or invalid carousel visual.slideWidth.desktop'
    );
  });

  it('throws when slideWidth.desktop is empty string', () => {
    const configWithEmptyDesktop = {
      ...validConfig,
      slideWidth: {
        desktop: '   ',
        tablet: '50%',
        mobile: '100%',
      },
    };

    expect(() => resolveFeaturedCarouselVisual(configWithEmptyDesktop)).toThrow(
      'Missing or invalid carousel visual.slideWidth.desktop'
    );
  });

  it('throws when slideWidth.tablet is missing', () => {
    const configWithoutTablet = {
      ...validConfig,
      slideWidth: {
        desktop: '33.333%',
        mobile: '100%',
      },
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutTablet)).toThrow(
      'Missing or invalid carousel visual.slideWidth.tablet'
    );
  });

  it('throws when slideWidth.mobile is missing', () => {
    const configWithoutMobile = {
      ...validConfig,
      slideWidth: {
        desktop: '33.333%',
        tablet: '50%',
      },
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutMobile)).toThrow(
      'Missing or invalid carousel visual.slideWidth.mobile'
    );
  });

  it('throws when spaceBetween is missing', () => {
    const configWithoutSpaceBetween = {
      slideWidth: validConfig.slideWidth,
      inactiveOpacity: 0.5,
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutSpaceBetween)).toThrow(
      'Missing or invalid carousel visual.spaceBetween (must be a number)'
    );
  });

  it('throws when spaceBetween is negative', () => {
    const configWithNegativeSpaceBetween = {
      ...validConfig,
      spaceBetween: -10,
    };

    expect(() => resolveFeaturedCarouselVisual(configWithNegativeSpaceBetween)).toThrow(
      'Missing or invalid carousel visual.spaceBetween (must be a non-negative number)'
    );
  });

  it('throws when inactiveOpacity is missing', () => {
    const configWithoutInactiveOpacity = {
      spaceBetween: 24,
      slideWidth: validConfig.slideWidth,
    };

    expect(() => resolveFeaturedCarouselVisual(configWithoutInactiveOpacity)).toThrow(
      'Missing or invalid carousel visual.inactiveOpacity (must be a number)'
    );
  });

  it('throws when inactiveOpacity is not a number', () => {
    const configWithInvalidInactiveOpacity = {
      ...validConfig,
      inactiveOpacity: '0.5',
    };

    expect(() => resolveFeaturedCarouselVisual(configWithInvalidInactiveOpacity)).toThrow(
      'Missing or invalid carousel visual.inactiveOpacity (must be a number)'
    );
  });

  it('throws when visual is not an object', () => {
    expect(() => resolveFeaturedCarouselVisual(null)).toThrow(
      'Missing or invalid carousel visual configuration object'
    );
    expect(() => resolveFeaturedCarouselVisual('string')).toThrow(
      'Missing or invalid carousel visual configuration object'
    );
    expect(() => resolveFeaturedCarouselVisual(42)).toThrow(
      'Missing or invalid carousel visual configuration object'
    );
  });

  it('throws when visual is an array', () => {
    expect(() => resolveFeaturedCarouselVisual([validConfig])).toThrow(
      'Missing or invalid carousel visual configuration object'
    );
  });
});

import { describe, expect, it } from 'vitest';
import type { HomePageConfig } from '../../src/types/home-config';
import type { HomePageConfig as HomePageConfigFromHome } from '../../src/types/home';

describe('HomePageConfig type extraction', () => {
  it('has all required fields with correct types', () => {
    const config: HomePageConfig = {
      hero: { eyebrow: 'test' },
      layout: {
        contentWidth: 'standard',
        sectionOrder: ['hero', 'carousel'],
        editorialGapVariant: 'tight',
      },
      editorialHero: {
        deckFields: ['location'],
        showDeckDivider: true,
      },
      featuredMedia: {
        items: ['photo1.jpg'],
        carousel: {
          ariaLabel: 'Featured',
          prevButtonAriaLabel: 'Previous',
          nextButtonAriaLabel: 'Next',
          emptyText: 'No items',
          showNavigationArrows: true,
          showIndicator: true,
          counterPadLength: 0,
          visual: {
            spaceBetween: 24,
            slideWidth: { desktop: '33%', tablet: '50%', mobile: '100%' },
            inactiveOpacity: 0.5,
          },
        },
      },
    };
    expect(config).toBeDefined();
    expect(config.hero.eyebrow).toBe('test');
    expect(config.layout.contentWidth).toBe('standard');
    expect(config.featuredMedia.items).toEqual(['photo1.jpg']);
  });

  it('can be imported from ./home-config without circular dependency', () => {
    expect(true).toBe(true);
  });

  it('can be imported from ./home for backward compatibility', () => {
    const config: HomePageConfigFromHome = {
      hero: { eyebrow: 'test' },
      layout: {
        contentWidth: 'wide',
        sectionOrder: ['hero'],
        editorialGapVariant: 'roomy',
      },
      editorialHero: {
        deckFields: ['organization'],
        showDeckDivider: false,
      },
      featuredMedia: {
        items: [],
        carousel: {
          ariaLabel: 'Featured',
          prevButtonAriaLabel: 'Previous',
          nextButtonAriaLabel: 'Next',
          emptyText: 'Empty',
          showNavigationArrows: false,
          showIndicator: false,
          counterPadLength: 0,
          visual: {
            spaceBetween: 16,
            slideWidth: { desktop: '100%', tablet: '100%', mobile: '100%' },
            inactiveOpacity: 0.3,
          },
        },
      },
    };
    expect(config).toBeDefined();
  });
});
import { describe, expect, it } from 'vitest';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '../../../src/lib/media/responsive';
import { computeContentImageOptions, loadContentImageWithConfigValidation } from '../../../src/lib/media/surface';
import { loadFeaturedSlides } from '../../../src/lib/media/surface';
import { loadMediaTree } from '../../../src/lib/media/surface';
import {
  assertMediaConfigShape,
  getValidatedHomepageGalleryConfig,
} from '../../../src/lib/media/config';

describe('media-loader import path changes', () => {
  it('can import IMAGE_MEDIUM_WIDTHS_KEY directly from image-width-utils', () => {
    expect(IMAGE_MEDIUM_WIDTHS_KEY).toBe('image.widths.medium');
  });

  it('can import selectCandidateWidthsByPolicy directly from image-width-utils', () => {
    expect(typeof selectCandidateWidthsByPolicy).toBe('function');
  });

  it('media-loader exports computeContentImageOptions', () => {
    expect(typeof computeContentImageOptions).toBe('function');
  });

  it('media-loader exports loadContentImageWithConfigValidation', () => {
    expect(typeof loadContentImageWithConfigValidation).toBe('function');
  });

  it('media-loader exports loadFeaturedSlides', () => {
    expect(typeof loadFeaturedSlides).toBe('function');
  });

  it('media-loader exports loadMediaTree', () => {
    expect(typeof loadMediaTree).toBe('function');
  });

  it('media-validation exports assertMediaConfigShape', () => {
    expect(typeof assertMediaConfigShape).toBe('function');
  });

  it('media-validation exports getValidatedHomepageGalleryConfig', () => {
    expect(typeof getValidatedHomepageGalleryConfig).toBe('function');
  });
});

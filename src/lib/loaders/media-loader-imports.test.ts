import { describe, expect, it } from 'vitest';
import {
  IMAGE_MEDIUM_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from '../utils/image-width-utils';
import {
  deriveContentImageOptions,
  loadContentImage,
  loadFeaturedSlides,
  loadMediaTree,
} from './media-loader';
import {
  assertMediaConfigShape,
  getValidatedHomepageGalleryConfig,
} from './media-validation';

describe('media-loader import path changes', () => {
  it('can import IMAGE_MEDIUM_WIDTHS_KEY directly from image-width-utils', () => {
    expect(IMAGE_MEDIUM_WIDTHS_KEY).toBe('image.widths.medium');
  });

  it('can import selectCandidateWidthsByPolicy directly from image-width-utils', () => {
    expect(typeof selectCandidateWidthsByPolicy).toBe('function');
  });

  it('media-loader exports deriveContentImageOptions', () => {
    expect(typeof deriveContentImageOptions).toBe('function');
  });

  it('media-loader exports loadContentImage', () => {
    expect(typeof loadContentImage).toBe('function');
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

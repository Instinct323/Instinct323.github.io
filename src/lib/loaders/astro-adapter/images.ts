import type { ImageMetadata } from 'astro';

/**
 * Image modules glob for content images
 * Using hardcoded path because Vite's import.meta.glob requires string literals
 */
export const CONTENT_IMAGE_MODULES = import.meta.glob<{ default: ImageMetadata }>(
  '../../../../content/**/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

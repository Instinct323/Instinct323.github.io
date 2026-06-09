/**
 * Astro/Vite Framework Adapter
 *
 * This file isolates all framework-specific build-time imports (Astro/Vite) to a single location:
 * - import.meta.glob results
 * - ?raw imports
 * - Static asset imports
 * - astro:assets functions and components (getImage, Image)
 */

import type { ImageMetadata } from 'astro';
import { getImage, Image } from 'astro:assets';
import type { Publication } from '../../types/site';

// =============================================================================
// Astro Assets Wrapper (isolates astro:assets imports)
// =============================================================================

/** Thin wrapper around Astro's getImage to keep astro:assets imports centralized. */
export async function optimizeImage(options: Parameters<typeof getImage>[0]) {
  return getImage(options);
}

/** Re-export Astro's Image component for centralized framework access. */
export { Image };

// =============================================================================
// Content Module Globs (Vite import.meta.glob)
// =============================================================================

/**
 * Image modules glob for content images
 * Using hardcoded path because Vite's import.meta.glob requires string literals
 */
export const CONTENT_IMAGE_MODULES = import.meta.glob<{ default: ImageMetadata }>(
  '../../../content/**/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

/**
 * Publication modules glob for about/publication JSON files
 */
export const PUBLICATION_MODULES = import.meta.glob<{ default: Publication }>(
  '../../../content/about/publication/*.json',
  { eager: true }
);

/**
 * Blog post modules glob with raw content
 */
export const BLOG_POST_MODULES = import.meta.glob<string>(
  '../../../content/blog/*/README.md',
  { eager: true, query: '?raw', import: 'default' }
);

// =============================================================================
// Raw Content Imports (Vite ?raw suffix)
// =============================================================================

export { default as introductionRaw } from '../../../content/about/introduction.md?raw';
export { default as siteConfigRaw } from '../../../content/config.jsonc?raw';

// =============================================================================
// Static Asset Imports (Vite direct imports)
// =============================================================================

export { default as backgroundDesktopSource } from '../../../content/background/desktop.jpg';
export { default as backgroundMobileSource } from '../../../content/background/mobile.jpg';
export { default as profile } from '../../../content/about/profile.json';

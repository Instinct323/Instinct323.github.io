/**
 * Astro/Vite Framework Adapter
 *
 * This file isolates all framework-specific build-time imports (Astro/Vite) to a single location:
 * - import.meta.glob results
 * - ?raw imports
 * - Static asset imports
 * - astro:assets functions and components (getImage, Image)
 */

import { getImage, Image } from 'astro:assets';

// =============================================================================
// Astro Assets Wrapper (isolates astro:assets imports)
// =============================================================================

export { getImage, Image };

// =============================================================================
// Content Module Globs (Vite import.meta.glob)
// =============================================================================

export { CONTENT_IMAGE_MODULES } from './astro-adapter/images';
export { PUBLICATION_MODULES } from './astro-adapter/publications';
export { BLOG_POST_MODULES } from './astro-adapter/blog';

// =============================================================================
// Raw Content Imports (Vite ?raw suffix)
// =============================================================================

export { introductionRaw, siteConfigRaw, profile } from './astro-adapter/config';

// =============================================================================
// Static Asset Imports (Vite direct imports)
// =============================================================================

export { backgroundDesktopSource, backgroundMobileSource } from './astro-adapter/assets';

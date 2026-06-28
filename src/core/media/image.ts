import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { CONTENT_IMAGE_MODULES } from '~/core/content/astro-adapter/images';

import {
  filenameWithoutExt,
  folderNameToSlug,
  sanitizePositiveWidths,
  slugToTitle,
  stripNumericPrefix,
} from '~/core/content/normalize';
import { RESPONSIVE_WIDTH_STEPS } from '~/core/media/sizing';
import { assertPositiveScale } from '~/core/validation/assert';
import {
  CONTENT_MODULE_KEY_TEMPLATE,
  PHOTOGRAPHY_MODULE_KEY_PREFIX,
} from '~/core/content/paths';

import type {
  ContentImage,
  ContentImageOptions,
  ContentImageResponsive,
} from '~/core/media/types';

export interface ParsedMediaPath {
  album?: string;
  alt: string;
  categoryId: string;
  categoryTitle: string;
}

export interface ImageVariantSet {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const CONTENT_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

/** Sanitizes user-provided paths to prevent directory traversal and enforce extensions. */
export function normalizeContentImagePath(path: string): string | null {
  const normalizedPath = path.trim().replace(/^\.\//, '').replace(/^\//, '');

  if (!normalizedPath || normalizedPath.includes('..') || !CONTENT_IMAGE_EXTENSIONS.test(normalizedPath)) {
    return null;
  }

  return normalizedPath.startsWith('content/') ? normalizedPath.slice('content/'.length) : normalizedPath;
}

/** Looks up image metadata from the Astro content module glob, with photography prefix fallback. */
export function resolveContentImageMetadata(path: string): ImageMetadata | null {
  const normalizedPath = normalizeContentImagePath(path);

  if (!normalizedPath) {
    return null;
  }

  const directMatch = CONTENT_IMAGE_MODULES[`${CONTENT_MODULE_KEY_TEMPLATE}${normalizedPath}`]?.default;
  if (directMatch) {
    return directMatch;
  }

  // config.jsonc paths like "0-travel/..." need to map to "photography/0-travel/..."
  const withPhotographyPrefix = `${PHOTOGRAPHY_MODULE_KEY_PREFIX}${normalizedPath}`;
  return CONTENT_IMAGE_MODULES[`${CONTENT_MODULE_KEY_TEMPLATE}${withPhotographyPrefix}`]?.default ?? null;
}

/** Extracts album, category, and alt text from photography content paths for semantic labeling. */
export function parseMediaPath(path: string): ParsedMediaPath | null {
  const segments = path.split('/');
  const mediaIndex = segments.indexOf('photography');

  if (mediaIndex === -1 || segments.length <= mediaIndex + 2) {
    return null;
  }

  const categoryFolder = segments[mediaIndex + 1];
  const filename = segments[segments.length - 1];
  const albumFolder = segments.length > mediaIndex + 3 ? segments[mediaIndex + 2] : undefined;
  const categoryId = folderNameToSlug(categoryFolder);
  const album = albumFolder ? stripNumericPrefix(albumFolder) : undefined;
  const filenameBase = filenameWithoutExt(filename);
  const categoryTitle = slugToTitle(categoryId);
  const alt = album ? `${album} - ${filenameBase}` : `${categoryTitle} - ${filenameBase}`;

  return {
    album,
    alt,
    categoryId,
    categoryTitle,
  };
}

function fallbackAltFromContentPath(path: string): string {
  const normalizedPath = normalizeContentImagePath(path);

  if (!normalizedPath) {
    return 'Image';
  }

  if (normalizedPath.startsWith(PHOTOGRAPHY_MODULE_KEY_PREFIX)) {
    const parsed = parseMediaPath(`../../content/${normalizedPath}`);
    if (parsed?.alt) {
      return parsed.alt;
    }
  }

  const filename = normalizedPath.split('/').pop();
  return filename ? slugToTitle(filenameWithoutExt(filename)) : 'Image';
}

function resolveContentImageAlt(path: string, alt?: string): string {
  if (typeof alt === 'string' && alt.trim()) {
    return alt.trim();
  }

  return fallbackAltFromContentPath(path);
}

/** Scales the source image width so its longest edge does not exceed maxLongEdge, preserving aspect ratio. */
function getMaxResponsiveWidth(source: ImageMetadata, maxLongEdge: number): number {
  const longEdge = Math.max(source.width, source.height);
  const scale = Math.min(1, maxLongEdge / longEdge);
  return Math.max(1, Math.round(source.width * scale));
}

function computeResponsiveWidths(source: ImageMetadata, options: ContentImageOptions): number[] {
  const explicitWidths = sanitizePositiveWidths(options.widths);

  if (explicitWidths.length > 0) {
    return capWidthsBySourceWidth(explicitWidths, source.width);
  }

  const maxLongEdge = assertPositiveScale(options.maxLongEdge, 'maxLongEdge');
  const maxWidth = getMaxResponsiveWidth(source, maxLongEdge);
  const widths = RESPONSIVE_WIDTH_STEPS.filter(width => width < maxWidth);

  widths.push(maxWidth);

  return Array.from(new Set(widths.filter(width => width > 0))).sort((a, b) => a - b);
}

/** Builds responsive width metadata and validates format/quality before generating the responsive descriptor. */
function createContentImageResponsive(source: ImageMetadata, options: ContentImageOptions): ContentImageResponsive {
  const widths = computeResponsiveWidths(source, options);

  const format = options.format;
  if (!format || typeof format !== 'string') {
    throw new Error('format is required and must be a non-empty string');
  }

  const quality = assertPositiveScale(options.quality, 'quality');

  return {
    src: source.src,
    // WARNING: this srcset contains a single value; the real multi-value srcset is generated by createImageVariantSet.
    srcset: `${source.src} ${source.width}w`,
    format,
    quality,
    widths,
    sizes: options.sizes,
    maxLongEdge: options.maxLongEdge,
  };
}

/** Builds a complete ContentImage with responsive metadata from a content path. */
export function loadContentImageResolved(path: string, options: ContentImageOptions): ContentImage | null {
  const normalizedPath = normalizeContentImagePath(path);
  const source = resolveContentImageMetadata(path);

  if (!normalizedPath) {
    throw new Error(`[loadContentImageResolved] rejected path (failed normalize): ${path}`);
  }
  if (!source) {
    throw new Error(`[loadContentImageResolved] no image metadata matched path: ${normalizedPath}`);
  }

  return {
    path: normalizedPath,
    source,
    alt: resolveContentImageAlt(normalizedPath, options.alt),
    width: source.width,
    height: source.height,
    aspectRatio: source.width / source.height,
    responsive: createContentImageResponsive(source, options),
  };
}

function withFallbackWidth(widths: number[], fallback: number): number[] {
  return widths.length > 0 ? widths : [fallback];
}

/** Caps explicit widths to the source image width. Falls back to the full source width when every explicit width is larger, so the responsive set is never empty. */
function capWidthsBySourceWidth(widths: number[], sourceWidth: number): number[] {
  const bounded = widths.filter((width) => width <= sourceWidth);
  return withFallbackWidth(bounded, sourceWidth);
}

/** Normalizes responsive widths, deduplicates, and falls back to the full image width when the set would otherwise be empty (e.g. all widths were filtered out as invalid or oversized). */
function computeRenderableWidths(image: ContentImage): number[] {
  const responsiveWidths = image.responsive.widths
    .filter((width) => Number.isInteger(width) && width > 0 && width <= image.width);
  const normalizedWidths = Array.from(new Set(responsiveWidths)).sort((a, b) => a - b);
  return withFallbackWidth(normalizedWidths, image.width);
}

/** Generates Astro-optimized image variants and srcset for responsive rendering. */
export async function createImageVariantSet(image: ContentImage): Promise<ImageVariantSet> {
  const widths = computeRenderableWidths(image);
  const variants = await Promise.all(
    widths.map((width) =>
      getImage({
        src: image.source,
        width,
        format: image.responsive.format,
        quality: image.responsive.quality,
      }),
    ),
  );

  const fallback = variants[variants.length - 1];
  const outputWidth = widths[widths.length - 1] ?? image.width;
  const outputHeight = Math.max(1, Math.round(outputWidth / image.aspectRatio));

  return {
    src: fallback.src,
    srcset: variants
      .map((variant, index) => `${variant.src} ${widths[index]}w`)
      .join(', '),
    width: outputWidth,
    height: outputHeight,
  };
}

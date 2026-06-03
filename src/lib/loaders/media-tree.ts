import type { ImageMetadata } from 'astro';

import { compareNatural } from '../utils/content-normalize';
import { PHOTOGRAPHY_FILTER, CONTENT_IMAGE_PATH_PREFIX } from './content-paths';
import { HOME_COVERFLOW_SIZES } from './media-responsive';
import type {
  ContentImage,
  ContentImageOptions,
  FeaturedSlide,
  MediaAlbum,
  MediaCategory,
  MediaConfig,
  MediaImage,
  MediaTree,
} from '../../types';
import { parseMediaPath, buildImageVariantSet } from './media-loader-core';
import { CONTENT_IMAGE_MODULES } from './astro-adapter';

export type { ParsedMediaPath } from './media-loader-core';

export interface CategoryAccumulator {
  id: string;
  title: string;
  testId: string;
  images: MediaImage[];
  albumsMap: Map<string, MediaAlbum>;
}

interface ImageModuleEntry {
  default: ImageMetadata;
}

export function appendImageToCategoryMap(
  categoryMap: Map<string, CategoryAccumulator>,
  path: string,
  image: MediaImage
): void {
  const parsed = parseMediaPath(path);

  if (!parsed) {
    return;
  }

  if (!categoryMap.has(parsed.categoryId)) {
    categoryMap.set(parsed.categoryId, {
      id: parsed.categoryId,
      title: parsed.categoryTitle,
      testId: `gallery-${parsed.categoryId}`,
      images: [],
      albumsMap: new Map<string, MediaAlbum>(),
    });
  }

  const category = categoryMap.get(parsed.categoryId)!;

  image.alt = image.alt || parsed.alt;
  image.album = parsed.album;

  if (parsed.album) {
    if (!category.albumsMap.has(parsed.album)) {
      category.albumsMap.set(parsed.album, {
        id: parsed.album.toLowerCase().replace(/\s+/g, '-'),
        title: parsed.album,
        images: [],
      });
    }

    const album = category.albumsMap.get(parsed.album)!;

    album.images.push(image);
    return;
  }

  category.images.push(image);
}

export function compareMediaModuleEntries(
  [pathA]: [string, ImageModuleEntry],
  [pathB]: [string, ImageModuleEntry]
): number {
  return compareNatural(pathA, pathB);
}

function isImageModuleEntry(mod: unknown): mod is ImageModuleEntry {
  return mod !== null && typeof mod === 'object' && 'default' in mod;
}

function finalizeCategories(categoryMap: Map<string, CategoryAccumulator>): MediaCategory[] {
  return Array.from(categoryMap.values()).map((cat) => {
    const albums = Array.from(cat.albumsMap.values());
    return {
      id: cat.id,
      title: cat.title,
      testId: cat.testId,
      images: cat.images,
      albums: albums.length > 0 ? albums : undefined,
    };
  });
}

export async function createFeaturedSlide(image: ContentImage): Promise<FeaturedSlide> {
  const variantSet = await buildImageVariantSet(image);

  return {
    src: variantSet.src,
    srcset: variantSet.srcset,
    sizes: image.responsive.sizes ?? HOME_COVERFLOW_SIZES,
    alt: image.alt,
    width: variantSet.width,
    height: variantSet.height,
    aspectRatio: image.aspectRatio,
    image,
  };
}

export async function loadFeaturedSlidesForHomepage(
  featuredPaths: string[],
  homeImageOptions: ContentImageOptions,
  loadContentImage: (_path: string, _options: ContentImageOptions) => Promise<ContentImage | null>
): Promise<FeaturedSlide[]> {
  const featuredImages = await Promise.all(featuredPaths.map(async (path) => {
    const image = await loadContentImage(path, homeImageOptions);

    if (!image) {
      throw new Error(`Invalid homepage.featured: failed to load validated image "${path}".`);
    }

    return image;
  }));

  return Promise.all(featuredImages.map((image) => createFeaturedSlide(image)));
}

export async function loadMediaTreeFromGallery(
  gridConfig: MediaConfig['grid'],
  galleryImageOptions: ContentImageOptions,
  loadImageFromContentPath: (_path: string, _options: ContentImageOptions) => MediaImage | null
): Promise<MediaTree> {
  const categoryMap = new Map<string, CategoryAccumulator>();

  const entries = Object.entries(CONTENT_IMAGE_MODULES) as [string, ImageModuleEntry][];
  for (const [path, mod] of entries.sort(compareMediaModuleEntries)) {
    if (!path.includes(PHOTOGRAPHY_FILTER) || !isImageModuleEntry(mod)) {
      continue;
    }

    const image = loadImageFromContentPath(path.replace(CONTENT_IMAGE_PATH_PREFIX, ''), galleryImageOptions);

    if (!image) {
      continue;
    }

    appendImageToCategoryMap(categoryMap, path, image);
  }

  return {
    categories: finalizeCategories(categoryMap),
    grid: {
      columns: gridConfig.columns,
      gap: gridConfig.gap,
    },
  };
}
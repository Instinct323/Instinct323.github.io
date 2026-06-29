import type { ImageMetadata } from 'astro';

import { compareNatural } from '~/core/content/normalize';
import { PHOTOGRAPHY_FILTER, CONTENT_IMAGE_PATH_PREFIX } from '~/core/content/paths';
import type { ContentImageOptions, MediaAlbum, MediaCategory, MediaImage, MediaTree } from '~/core/media/types';
import type { MediaConfig } from '~/features/site/types';
import { parseMediaPath } from '~/core/media/image';
import { CONTENT_IMAGE_MODULES } from '~/core/content/astro-adapter/images';

export type { ParsedMediaPath } from '~/core/media/image';

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

function appendImageToCategoryMap(
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

  const category = categoryMap.get(parsed.categoryId);
  if (!category) {
    throw new Error(`Category ${parsed.categoryId} missing after creation`);
  }

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

    const album = category.albumsMap.get(parsed.album);
    if (!album) {
      throw new Error(`Album ${parsed.album} missing after creation`);
    }

    album.images.push(image);
    return;
  }

  category.images.push(image);
}

/** Type guard for Vite glob results: Astro image imports are objects with a `default` export containing ImageMetadata, but the glob type is too broad to guarantee this at compile time. */
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

export async function loadMediaTreeFromGallery(
  gridConfig: MediaConfig['grid'],
  galleryImageOptions: ContentImageOptions,
  loadImageFromContentPath: (_path: string, _options: ContentImageOptions) => MediaImage | null
): Promise<MediaTree> {
  const categoryMap = new Map<string, CategoryAccumulator>();

  const entries = Object.entries(CONTENT_IMAGE_MODULES)
    .filter((entry): entry is [string, ImageModuleEntry] => isImageModuleEntry(entry[1]))
    .sort(([pathA], [pathB]) => compareNatural(pathA, pathB));

  for (const [path, _mod] of entries) {
    if (!path.includes(PHOTOGRAPHY_FILTER)) {
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
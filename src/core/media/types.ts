import type { ImageMetadata } from 'astro';

export interface ContentImageOptions {
  alt?: string;
  format?: string;
  quality?: number;
  widths?: number[];
  sizes?: string;
  maxLongEdge?: number;
}

export interface ContentImageResponsive {
  src: string;
  srcset: string;
  format: string;
  quality: number;
  widths: number[];
  sizes?: string;
  maxLongEdge?: number;
}

export interface ContentImage {
  path: string;
  source: ImageMetadata;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
  responsive: ContentImageResponsive;
}

export interface MediaImage extends Omit<ContentImage, 'source'> {
  src: ImageMetadata;
  caption?: string;
  album?: string;
}

/** A named collection of related media images (e.g. a photography album). */
export interface MediaAlbum {
  id: string;
  title: string;
  images: MediaImage[];
}

/** A top-level photography category containing flat images and optional sub-albums. */
export interface MediaCategory {
  id: string;
  title: string;
  testId: string;
  images: MediaImage[];
  albums?: MediaAlbum[];
}

/** The full photography media tree: categories with their grid layout settings. */
export interface MediaTree {
  categories: MediaCategory[];
  grid: {
    columns: {
      desktop: number;
      mobile: number;
    };
    gap: string;
  };
}

/** A homepage carousel slide with its fully-rendered responsive image variants. */
export interface FeaturedSlide {
  src: string;
  srcset: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
  image: ContentImage;
}


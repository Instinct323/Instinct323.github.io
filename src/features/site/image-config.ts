import type { ImageLoadingEffectName } from './image-effects';

export interface GridColumns {
  desktop: number;
  mobile: number;
}

export interface MediaGridConfig {
  columns: GridColumns;
  gap: string;
}

export interface SiteImageConfig {
  format: string;
  quality: number;
  widths: {
    medium: number[];
    high: number[];
  };
  dprScale: {
    low: number;
    medium: number;
    high: number;
  };
  lazyLoad: {
    rootMargin: string;
    localDebugDelayMs: number;
  };
  placeholderEffect: ImageLoadingEffectName;
}

export interface HomePageImageConfig {
  quality: number;
  widths: number[];
  format: string;
}
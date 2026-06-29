export const PAGE_LOAD_PRIORITY = ['frame', 'controls', 'background'] as const;

export type PageLoadStage = (typeof PAGE_LOAD_PRIORITY)[number];

/** Frame data: primary page-specific content (HomePageData, AboutFrame, etc.). */
export type FrameConfig = unknown;

/** Background data: optional visual resources (background images by variant, etc.). */
export type BackgroundConfig = unknown;

/** Controls data: optional UI controls (featured slides, avatar, etc.). */
export type ControlsConfig = unknown;

export interface PageLoadPlan<TFrame = FrameConfig, TBackground = BackgroundConfig, TControls = ControlsConfig> {
  /** Loads the primary page frame. Always required. */
  frame: () => Promise<TFrame>;
  /** Optional background loader. Receives the resolved frame. */
  background?: (_ctx: { frame: TFrame }) => Promise<TBackground>;
  /** Optional controls loader. Receives the resolved frame. */
  controls?: (_ctx: { frame: TFrame }) => Promise<TControls>;
}

export interface PageLoadResult<TFrame = FrameConfig, TBackground = BackgroundConfig, TControls = ControlsConfig> {
  /** Resolved frame data. Always present. */
  frame: TFrame;
  /** Resolved background data, or `null` when no background loader was supplied. */
  background: TBackground | null;
  /** Resolved controls data, or `null` when no controls loader was supplied. */
  controls: TControls | null;
}

export type ControlImagePriority = 'critical' | 'deferred';

export interface ControlImageLoadingAttrs {
  loading: 'eager' | 'lazy';
  decoding: 'sync' | 'async';
  fetchPriority: 'high' | 'auto';
}

export interface DeferredMountRuntimeConfig {
  selector: string;
  rootMargin: string;
  mountDelayMs: number;
}

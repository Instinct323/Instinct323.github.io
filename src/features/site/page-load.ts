export interface PageLoadPlan<TFrame = unknown, TBackground = unknown, TControls = unknown> {
  /** Loads the primary page frame. Always required. */
  frame: () => Promise<TFrame>;
  /** Optional background loader. Receives the resolved frame. */
  background?: (_ctx: { frame: TFrame }) => Promise<TBackground>;
  /** Optional controls loader. Receives the resolved frame. */
  controls?: (_ctx: { frame: TFrame }) => Promise<TControls>;
}

export interface PageLoadResult<TFrame = unknown, TBackground = unknown, TControls = unknown> {
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

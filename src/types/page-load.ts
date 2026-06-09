export const PAGE_LOAD_PRIORITY = ['frame', 'controls', 'background'] as const;

export type PageLoadStage = (typeof PAGE_LOAD_PRIORITY)[number];

type MaybePromise<T> = T | Promise<T>;

export interface PageLoadContext<TFrame, TBackground> {
  frame: TFrame;
  background: TBackground;
}

export interface PageLoadPlan<TFrame, TBackground, TControls> {
  frame: () => MaybePromise<TFrame>;
  background?: (_ctx: Pick<PageLoadContext<TFrame, TBackground>, 'frame'>) => MaybePromise<TBackground>;
  controls?: (_ctx: Pick<PageLoadContext<TFrame, TBackground>, 'frame'>) => MaybePromise<TControls>;
}

export interface PageLoadResult<TFrame, TBackground, TControls> {
  frame: TFrame;
  background: TBackground;
  controls: TControls;
}

export type ControlImagePriority = 'critical' | 'deferred';

export interface ControlImageLoadingAttrs {
  loading: 'eager' | 'lazy';
  decoding: 'sync' | 'async';
  fetchPriority: 'high' | 'auto';
}

export interface DeferredImageLazyLoadConfig {
  rootMargin: string;
  localDebugDelayMs: number;
}

export interface DeferredMountRuntimeConfig {
  selector: string;
  rootMargin: string;
  mountDelayMs: number;
}
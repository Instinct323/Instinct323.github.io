import type {
  PageLoadStage,
  PageLoadPlan,
  PageLoadResult,
  ControlImagePriority,
  ControlImageLoadingAttrs,
} from '../../types/page-load';

export { PAGE_LOAD_PRIORITY } from '../../types/page-load';
export type { PageLoadStage };

export function resolveControlImageLoading(priority: ControlImagePriority): ControlImageLoadingAttrs {
  if (priority === 'critical') {
    return { loading: 'eager', decoding: 'sync', fetchPriority: 'high' };
  }
  return { loading: 'lazy', decoding: 'async', fetchPriority: 'auto' };
}

/**
 * Executes a page-load plan in three sequential stages: frame, controls,
 * background. Kept as a dedicated function so the orchestration order is
 * defined in one place; future rules (parallel controls, timeouts,
 * retries) can be added here without touching every page.
 */
export async function orchestratePageLoad<
  TFrame,
  TBackground = undefined,
  TControls = null
>(plan: PageLoadPlan<TFrame, TBackground, TControls>): Promise<PageLoadResult<TFrame, TBackground, TControls>> {
  const frame = await plan.frame();
  const controls = plan.controls ? await plan.controls({ frame }) : null;
  const background = plan.background ? await plan.background({ frame }) : null;
  return { frame, background: background as TBackground, controls: controls as TControls };
}
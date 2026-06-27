import type {
  PageLoadStage,
  PageLoadPlan,
  PageLoadResult,
  ControlImagePriority,
  ControlImageLoadingAttrs,
} from '../../types/page-load';

export { PAGE_LOAD_PRIORITY } from '../../types/page-load';
export type { PageLoadStage };

/**
 * Maps an image loading priority to the corresponding HTML attribute set.
 * Critical images (e.g. hero, first viewport content) use eager+sync+high
 * to block rendering until decoded and to win the network race. All other
 * images default to lazy+async+auto so they do not compete for bandwidth
 * or main-thread decoding time during initial load.
 */
export function resolveControlImageLoading(priority: ControlImagePriority): ControlImageLoadingAttrs {
  if (priority === 'critical') {
    return { loading: 'eager', decoding: 'sync', fetchPriority: 'high' };
  }
  return { loading: 'lazy', decoding: 'async', fetchPriority: 'auto' };
}

/** Executes a page-load plan in three sequential stages: frame, controls, background. */
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
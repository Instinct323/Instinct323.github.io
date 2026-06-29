import type {
  PageLoadStage,
  PageLoadPlan,
  PageLoadResult,
  ControlImagePriority,
  ControlImageLoadingAttrs,
} from '~/features/site/page-load';

export { PAGE_LOAD_PRIORITY } from '~/features/site/page-load';
export type { PageLoadStage };

import { loadBlogPosts } from '~/features/blog/loader';
import { loadAboutPageFrameWithMedia, loadAboutAvatarImage } from '~/features/about/page-loader';
import { loadHomePage } from '~/features/home/content-loader';
import { loadPhotographyPage } from '~/features/photography/loader';

export type PageKey = 'home' | 'about' | 'blog' | 'photography';

export interface PageLoader<TFrame = unknown, TControl = unknown> {
  frame: () => Promise<TFrame>;
  controls?: (_ctx: { frame: TFrame }) => Promise<TControl>;
}

const PAGE_LOADERS = {
  home: { frame: loadHomePage },
  about: {
    frame: loadAboutPageFrameWithMedia,
    controls: ({ frame }: { frame: Awaited<ReturnType<typeof loadAboutPageFrameWithMedia>> }) => loadAboutAvatarImage(frame.profile),
  },
  blog: { frame: async () => ({ posts: loadBlogPosts() }) },
  photography: { frame: loadPhotographyPage },
};

/**
 * Returns the page loader for the given key.
 *
 * @throws if `key` is not registered. This is a fail-fast contract — unknown
 * keys indicate a programmer error (typo, missing registration) and must
 * surface immediately, not return `null` and force every caller to handle it.
 */
export function getPageLoader<TFrame, TControl>(key: PageKey): PageLoader<TFrame, TControl> {
  const loader = PAGE_LOADERS[key] as PageLoader<TFrame, TControl>;
  if (!loader) {
    throw new Error(`No page loader registered for key: ${key}`);
  }
  return loader;
}

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

/**
 * Loads the page frame first, then runs `controls` and `background` in
 * parallel (both depending on the frame). The shape lets callers load
 * critical data sequentially while deferring less-critical work.
 */
export async function orchestratePageLoad<TFrame, TBackground, TControls>(
  plan: PageLoadPlan<TFrame, TBackground, TControls>,
): Promise<PageLoadResult<TFrame, TBackground, TControls>> {
  const frame = await plan.frame();
  const controls = plan.controls ? await plan.controls({ frame }) : null;
  const background = plan.background ? await plan.background({ frame }) : null;
  return { frame, background, controls };
}

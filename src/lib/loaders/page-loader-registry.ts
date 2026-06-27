export type PageKey = 'home' | 'about' | 'blog' | 'photography';

/** Registered loader for a page route.
 *  `frame` returns the page data; `controls` returns extra data
 *  that depends on the frame (e.g. an avatar image that needs profile). */
export interface PageLoader<TFrame = unknown, TControl = unknown> {
  frame: () => Promise<TFrame>;
  controls?: (_ctx: { frame: TFrame }) => Promise<TControl>;
}

const registry = new Map<PageKey, PageLoader<unknown, unknown>>();

/** Registers a page loader so `getPageLoader(key)` can retrieve it. */
export function registerPageLoader<TFrame, TControl>(
  key: PageKey,
  loader: PageLoader<TFrame, TControl>,
): void {
  registry.set(key, loader as PageLoader<unknown, unknown>);
}

/** Retrieves the loader previously registered for `key`. Throws if missing. */
export function getPageLoader<TFrame, TControl>(key: PageKey): PageLoader<TFrame, TControl> {
  const loader = registry.get(key);
  if (!loader) {
    throw new Error(`No page loader registered for key: ${key}`);
  }
  return loader as PageLoader<TFrame, TControl>;
}

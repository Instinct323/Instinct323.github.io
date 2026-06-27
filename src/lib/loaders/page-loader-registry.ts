export type PageKey = 'home' | 'about' | 'blog' | 'photography';

export interface PageLoader {
  frame: () => Promise<unknown>;
  controls?: (_ctx: { frame: unknown }) => Promise<unknown>;
}

const registry = new Map<PageKey, PageLoader>();

export function registerPageLoader(key: PageKey, loader: PageLoader): void {
  registry.set(key, loader);
}

export function getPageLoader(key: PageKey): PageLoader {
  const loader = registry.get(key);
  if (!loader) {
    throw new Error(`No page loader registered for key: ${key}`);
  }
  return loader;
}

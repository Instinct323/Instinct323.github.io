import type { BlogPostData } from '~/core/content/blog-data-types';

/**
 * Browser-side blog detail renderer.
 *
 * `window.__BLOG_META__` is set by an inline `<script is:inline>` in
 * `src/pages/blog.astro:236`. It carries a minimal `{ slug, title }[]` array
 * built at SSR time so this client can render the post list without a
 * second round-trip. Full post bodies are fetched lazily via /blog-data/{slug}.json.
 */
export function initBlogClient(): void {
  const blogList = document.getElementById('blog-list');
  const detailTitle = document.getElementById('detail-title');
  const detailContent = document.getElementById('detail-content');
  if (!blogList || !detailTitle || !detailContent) return;

  // After the guard above these elements are guaranteed non-null,
  // but TypeScript narrowing does not persist into nested closures,
  // so capture them as consts to avoid non-null assertions downstream.
  const blogListEl: HTMLElement = blogList;
  const detailTitleEl: HTMLElement = detailTitle;
  const detailContentEl: HTMLElement = detailContent;

  const postsMeta = window.__BLOG_META__;
  const metaBySlug = new Map(postsMeta.map((m) => [m.slug, m]));
  const postCache = new Map<string, BlogPostData>();
  const items = Array.from(blogListEl.querySelectorAll<HTMLElement>('.blog-item'));
  const defaultSlug = postsMeta[0]?.slug ?? '';

  let activeSlug = '';

  // Monotonic counter for stale-request protection. Incremented on every renderPost
  // invocation; async callbacks compare their captured generation against the current
  // value to abort if a newer render has started. Prevents older responses from
  // overwriting newer ones when the user clicks rapidly through the post list.
  let renderGeneration = 0;

  type LoadResult =
    | { ok: true; data: BlogPostData }
    | { ok: false; kind: 'http' | 'network'; status?: number };

  async function loadPost(slug: string): Promise<LoadResult> {
    const cached = postCache.get(slug);
    if (cached) return { ok: true, data: cached };
    try {
      const res = await fetch(`/blog-data/${slug}.json`);
      if (!res.ok) return { ok: false, kind: 'http', status: res.status };
      const data = (await res.json()) as BlogPostData;
      postCache.set(slug, data);
      return { ok: true, data };
    } catch (e) {
      console.error(`[blog] network error loading ${slug}:`, e);
      return { ok: false, kind: 'network' };
    }
  }

  function showStatus(text: string, kind: 'loading' | 'error'): void {
    detailContentEl.innerHTML = `<div class="blog-status blog-status--${kind}">${text}</div>`;
  }

  async function renderPost(slug: string): Promise<void> {
    const meta = metaBySlug.get(slug);
    if (!meta || activeSlug === slug) return;

    activeSlug = slug;
    const generation = ++renderGeneration;

    items.forEach((i) => i.classList.remove('active'));
    items.find((i) => i.dataset.slug === slug)?.classList.add('active');
    detailTitleEl.textContent = meta.title;
    showStatus('Loading...', 'loading');

    const result = await loadPost(slug);
    if (generation !== renderGeneration) return;
    if (!result.ok) {
      const msg =
        result.kind === 'http'
          ? `Failed to load article (HTTP ${result.status ?? '?'}).`
          : 'Failed to load article (network error).';
      showStatus(msg, 'error');
      return;
    }
    const post = result.data;

    detailTitleEl.textContent = post.title;

    try {
      const { renderPostContent, ensureKatexCss } = await import('~/features/blog/render-engine');
      if (post.hasLatex) ensureKatexCss();
      const html = await renderPostContent(post);
      if (generation !== renderGeneration) return;
      detailContentEl.innerHTML = html;
    } catch (e) {
      if (generation !== renderGeneration) return;
      console.error('Failed to render post:', e);
      showStatus('Failed to load article.', 'error');
    }
  }

  function navigateToSlug(slug: string): void {
    window.location.hash = slug === defaultSlug ? '' : slug;
  }

  function getSlugFromHash(): string {
    const slug = window.location.hash.slice(1);
    return metaBySlug.has(slug) ? slug : '';
  }

  items.forEach((item) => {
    const slug = item.dataset.slug;
    if (!slug) return;
    item.addEventListener('click', () => navigateToSlug(slug));
  });

  window.addEventListener('hashchange', () => {
    renderPost(getSlugFromHash() || defaultSlug);
  });

  const initialSlug = getSlugFromHash();
  if (initialSlug && initialSlug !== defaultSlug) {
    renderPost(initialSlug);
  }
}

import type { BlogPostData } from '~/core/content/blog-data-types';

export function initBlogClient(): void {
  const blogList = document.getElementById('blog-list');
  const detailTitle = document.getElementById('detail-title');
  const detailContent = document.getElementById('detail-content');
  if (!blogList || !detailTitle || !detailContent) return;

  const postsMeta = window.__BLOG_META__;
  const metaBySlug = new Map(postsMeta.map((m) => [m.slug, m]));
  const postCache = new Map<string, BlogPostData>();
  const items = Array.from(blogList.querySelectorAll<HTMLElement>('.blog-item'));
  const defaultSlug = postsMeta[0]?.slug ?? '';

  let activeSlug = '';
  let renderGeneration = 0;

  async function loadPost(slug: string): Promise<BlogPostData | null> {
    const cached = postCache.get(slug);
    if (cached) return cached;
    try {
      const res = await fetch(`/blog-data/${slug}.json`);
      if (!res.ok) return null;
      const data = (await res.json()) as BlogPostData;
      postCache.set(slug, data);
      return data;
    } catch {
      return null;
    }
  }

  function showStatus(text: string, kind: 'loading' | 'error'): void {
    detailContent!.innerHTML = `<div class="blog-status blog-status--${kind}">${text}</div>`;
  }

  async function renderPost(slug: string): Promise<void> {
    const meta = metaBySlug.get(slug);
    if (!meta || activeSlug === slug) return;

    activeSlug = slug;
    const generation = ++renderGeneration;

    items.forEach((i) => i.classList.remove('active'));
    items.find((i) => i.dataset.slug === slug)?.classList.add('active');
    detailTitle!.textContent = meta.title;
    showStatus('Loading...', 'loading');

    const post = await loadPost(slug);
    if (generation !== renderGeneration || !post) {
      if (generation === renderGeneration) showStatus('Failed to load article.', 'error');
      return;
    }

    detailTitle!.textContent = post.title;

    try {
      const { renderPostContent, ensureKatexCss } = await import('~/features/blog/render-engine');
      if (post.hasLatex) ensureKatexCss();
      const html = await renderPostContent(post);
      if (generation !== renderGeneration) return;
      detailContent!.innerHTML = html;
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

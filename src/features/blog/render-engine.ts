import type { BlogPostData } from '~/core/content/blog-data-types';
import { KATEX_CSS_HREF, KATEX_CSS_INTEGRITY } from './katex-constants';

export async function renderPostContent(post: BlogPostData): Promise<string> {
  const { renderMarkdown, renderMarkdownWithKatex } = await import('~/core/content/markdown-render');
  const render = post.hasLatex ? renderMarkdownWithKatex : renderMarkdown;
  return render(post.content, { fileURL: post.baseUrl });
}

export function ensureKatexCss(): void {
  if (document.querySelector('link[href*="katex.min.css"]')) {
    return;
  }

  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', KATEX_CSS_HREF);
  link.setAttribute('integrity', KATEX_CSS_INTEGRITY);
  link.setAttribute('crossorigin', 'anonymous');

  document.head.appendChild(link);
}

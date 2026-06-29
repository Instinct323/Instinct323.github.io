import type { BlogPostData } from '~/core/content/blog-data-types';

const KATEX_CSS_HREF = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
const KATEX_CSS_INTEGRITY =
  'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';

export async function renderPostContent(post: BlogPostData): Promise<string> {
  if (post.hasLatex) {
    const { renderMarkdownWithKatex } = await import('~/core/content/markdown-katex');
    return renderMarkdownWithKatex(post.content, { fileURL: post.baseUrl });
  }

  const { renderMarkdown } = await import('~/core/content/markdown-client');
  return renderMarkdown(post.content, { fileURL: post.baseUrl });
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

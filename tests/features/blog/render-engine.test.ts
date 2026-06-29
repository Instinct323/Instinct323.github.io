import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderMarkdownMock = vi.fn();
const renderMarkdownWithKatexMock = vi.fn();

vi.mock('~/core/content/markdown-client', () => ({
  renderMarkdown: renderMarkdownMock,
}));

vi.mock('~/core/content/markdown-katex', () => ({
  renderMarkdownWithKatex: renderMarkdownWithKatexMock,
}));

import { ensureKatexCss, renderPostContent } from '~/features/blog/render-engine';
import type { BlogPostData } from '~/core/content/blog-data-types';

const KATEX_HREF = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
const KATEX_INTEGRITY = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';

function makePost(overrides: Partial<BlogPostData> = {}): BlogPostData {
  return {
    title: 'Test Post',
    content: '# Hello',
    baseUrl: 'file:///content/blog/post1/README.md',
    hasLatex: false,
    ...overrides,
  };
}

describe('renderPostContent', () => {
  beforeEach(() => {
    renderMarkdownMock.mockReset();
    renderMarkdownWithKatexMock.mockReset();
    renderMarkdownMock.mockReturnValue('<h1>Hello</h1>');
    renderMarkdownWithKatexMock.mockReturnValue('<h1>Hello with math</h1>');
  });

  it('dispatches to renderMarkdown when hasLatex is false', async () => {
    const post = makePost({ hasLatex: false, content: '# plain' });
    const result = await renderPostContent(post);

    expect(renderMarkdownMock).toHaveBeenCalledTimes(1);
    expect(renderMarkdownMock).toHaveBeenCalledWith('# plain', { fileURL: post.baseUrl });
    expect(renderMarkdownWithKatexMock).not.toHaveBeenCalled();
    expect(result).toBe('<h1>Hello</h1>');
  });

  it('dispatches to renderMarkdownWithKatex when hasLatex is true', async () => {
    const post = makePost({ hasLatex: true, content: '$x^2$' });
    const result = await renderPostContent(post);

    expect(renderMarkdownWithKatexMock).toHaveBeenCalledTimes(1);
    expect(renderMarkdownWithKatexMock).toHaveBeenCalledWith('$x^2$', { fileURL: post.baseUrl });
    expect(renderMarkdownMock).not.toHaveBeenCalled();
    expect(result).toBe('<h1>Hello with math</h1>');
  });

  it('throws when the dynamic import of the katex renderer fails', async () => {
    renderMarkdownWithKatexMock.mockImplementationOnce(() => {
      throw new Error('katex renderer exploded');
    });

    const post = makePost({ hasLatex: true });

    await expect(renderPostContent(post)).rejects.toThrow('katex renderer exploded');
  });
});

describe('ensureKatexCss', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('injects a link element with correct href, integrity, and crossorigin', () => {
    ensureKatexCss();

    const link = document.querySelector('link[href*="katex.min.css"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toBe('stylesheet');
    expect(link?.getAttribute('href')).toBe(KATEX_HREF);
    expect(link?.getAttribute('integrity')).toBe(KATEX_INTEGRITY);
    expect(link?.getAttribute('crossorigin')).toBe('anonymous');
    expect(link?.parentElement).toBe(document.head);
  });

  it('does not inject a duplicate link when one already exists', () => {
    ensureKatexCss();
    const firstLink = document.querySelector('link[href*="katex.min.css"]');
    expect(firstLink).not.toBeNull();

    ensureKatexCss();
    const allLinks = document.querySelectorAll('link[href*="katex.min.css"]');
    expect(allLinks.length).toBe(1);
    expect(document.querySelector('link[href*="katex.min.css"]')).toBe(firstLink);
  });
});

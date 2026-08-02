import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlogPostData } from '~/core/content/blog-data-types';

const fetchMock = vi.fn();

import { initBlogClient } from '~/features/blog/client';

const postsMeta = [
  { slug: 'first', title: 'First post' },
  { slug: 'second', title: 'Second post' },
];

interface MockResponse {
  ok: boolean;
  status: number;
  json(): Promise<BlogPostData>;
}

function createPost(slug: string, overrides: Partial<BlogPostData> = {}): BlogPostData {
  return {
    title: postsMeta.find((post) => post.slug === slug)?.title ?? slug,
    html: `<p>${slug}</p>`,
    hasLatex: false,
    ...overrides,
  };
}

function successfulResponse(post: BlogPostData): MockResponse {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(post),
  };
}

function getItem(slug: string): HTMLElement {
  const item = document.querySelector<HTMLElement>(`.blog-item[data-slug="${slug}"]`);
  if (!item) {
    throw new Error(`Missing blog item for ${slug}.`);
  }
  return item;
}

function getDetailContent(): HTMLElement {
  const detailContent = document.getElementById('detail-content');
  if (!detailContent) {
    throw new Error('Missing blog detail content.');
  }
  return detailContent;
}

function setupClient(initialSlug: string): () => void {
  document.body.innerHTML = `
    <div id="blog-list">
      <button class="blog-item" data-slug="first">First post</button>
      <button class="blog-item" data-slug="second">Second post</button>
    </div>
    <h1 id="detail-title"></h1>
    <div id="detail-content"></div>
  `;
  window.__BLOG_META__ = postsMeta;
  window.history.replaceState(null, '', initialSlug ? `/#${initialSlug}` : '/');

  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  initBlogClient();
  const hashChangeListener = addEventListenerSpy.mock.calls.find(([type]) => type === 'hashchange')?.[1];
  addEventListenerSpy.mockRestore();

  if (!hashChangeListener) {
    throw new Error('Blog client did not register a hashchange listener.');
  }

  return () => window.removeEventListener('hashchange', hashChangeListener);
}

describe('initBlogClient', () => {
  let removeClientListener: (() => void) | undefined;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    removeClientListener?.();
    removeClientListener = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.history.replaceState(null, '', '/');
  });

  it('clears active state after an HTTP failure and retries the same hash on click', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce(successfulResponse(createPost('second')));
    removeClientListener = setupClient('second');

    await vi.waitFor(() => {
      expect(getDetailContent().textContent).toContain('HTTP 503');
    });
    expect(getItem('second').classList.contains('active')).toBe(false);

    getItem('second').click();

    await vi.waitFor(() => {
      expect(getDetailContent().innerHTML).toBe('<p>second</p>');
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getItem('second').classList.contains('active')).toBe(true);
  });

  it('clears active state after a network failure and retries the same hash on click', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(successfulResponse(createPost('second')));
    removeClientListener = setupClient('second');

    await vi.waitFor(() => {
      expect(getDetailContent().textContent).toContain('network error');
    });
    expect(getItem('second').classList.contains('active')).toBe(false);

    getItem('second').click();

    await vi.waitFor(() => {
      expect(getDetailContent().innerHTML).toBe('<p>second</p>');
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getItem('second').classList.contains('active')).toBe(true);
  });

  it('injects KaTeX CSS once for pre-rendered math posts', async () => {
    fetchMock
      .mockResolvedValueOnce(successfulResponse(createPost('second', {
        html: '<p><span class="katex">x</span></p>',
        hasLatex: true,
      })))
      .mockResolvedValueOnce(successfulResponse(createPost('first', {
        html: '<p><span class="katex">y</span></p>',
        hasLatex: true,
      })));
    removeClientListener = setupClient('second');

    await vi.waitFor(() => {
      expect(getDetailContent().innerHTML).toContain('class="katex"');
    });
    const link = document.querySelector('link[href*="katex.min.css"]');
    expect(link?.getAttribute('rel')).toBe('stylesheet');
    expect(link?.getAttribute('integrity')).toBe(
      'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV'
    );
    expect(link?.getAttribute('crossorigin')).toBe('anonymous');

    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await vi.waitFor(() => {
      expect(getDetailContent().innerHTML).toContain('>y</span>');
    });
    expect(document.querySelectorAll('link[href*="katex.min.css"]')).toHaveLength(1);
  });

  it('does not let a stale failure clear a newer active post', async () => {
    let resolveFirstFetch: (_response: MockResponse) => void = () => {
      throw new Error('First fetch resolver was not initialized.');
    };
    const firstFetch = new Promise<MockResponse>((resolve) => {
      resolveFirstFetch = resolve;
    });
    fetchMock
      .mockReturnValueOnce(firstFetch)
      .mockResolvedValueOnce(successfulResponse(createPost('first')));
    removeClientListener = setupClient('second');

    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await vi.waitFor(() => {
      expect(getDetailContent().innerHTML).toBe('<p>first</p>');
    });
    resolveFirstFetch({ ok: false, status: 500, json: vi.fn() });

    await vi.waitFor(() => {
      expect(getItem('first').classList.contains('active')).toBe(true);
    });
    expect(getItem('second').classList.contains('active')).toBe(false);
    expect(getDetailContent().innerHTML).toBe('<p>first</p>');
  });
});

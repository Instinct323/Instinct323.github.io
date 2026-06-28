import matter from 'gray-matter';
import { katex } from '@mdit/plugin-katex';
import MarkdownIt from 'markdown-it';
import { getDateTime } from './normalize';

export interface RenderMarkdownOptions {
  fileURL?: string;
}

export interface ParseMarkdownResult {
  title: string | null;
  date: Date | null;
  content: string;
  data: Record<string, unknown>;
}

/** Resolves relative src/href paths in rendered markdown HTML against a base file URL. */
function resolveRelativePaths(html: string, fileURL: string): string {
  const baseURL = new URL('.', fileURL).href;

  return html.replace(
    /(?:src|href)=["']([^"']+)["']/g,
    (match, path) => {
      if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:') ||
        path.startsWith('#') ||
        path.startsWith('mailto:') ||
        path.startsWith('tel:')
      ) {
        return match;
      }

      let resolved: URL;
      try {
        resolved = new URL(path, baseURL);
      } catch {
        throw new Error(`resolveRelativePaths: malformed relative path "${path}" in fileURL "${fileURL}"`);
      }
      let resolvedPath = resolved.href;

      if (resolvedPath.startsWith('file://')) {
        const contentMatch = resolvedPath.match(/\/content\/([^/]+)\/([^/]+)/);
        if (contentMatch) {
          const section = contentMatch[1];
          const slug = contentMatch[2];
          const assetMatch = resolvedPath.match(/\/assets\/(.+)$/);
          if (assetMatch) {
            resolvedPath = `/${section}/${slug}/assets/${assetMatch[1]}`;
          }
        }
      }

      return match.replace(path, resolvedPath);
    }
  );
}

const BASE_MARKDOWN_IT_OPTIONS = {
  html: false,
  xhtmlOut: false,
  breaks: false,
  linkify: false,
  typographer: false,
};

const md = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS);

function renderWithMd(renderer: MarkdownIt, markdown: string, options?: RenderMarkdownOptions): string {
  let html = renderer.render(markdown);

  if (options?.fileURL) {
    html = resolveRelativePaths(html, options.fileURL);
  }

  return html;
}

export function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(md, markdown, options);
}

// Module-level singleton: MarkdownIt instance with KaTeX. Intentionally reused across calls for performance.
const mdWithKatex = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS).use(katex);

export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(mdWithKatex, markdown, options);
}

function parseDateFromFrontmatter(data: Record<string, unknown> | undefined): Date | null {
  const time = getDateTime(data?.date as Date | string | null);
  return time !== null ? new Date(time) : null;
}

export function parseMarkdownWithFrontmatter(markdown: string): ParseMarkdownResult {
  const parsed = matter(markdown);
  const title = parsed.data?.title;
  const validTitle = typeof title === 'string' && title.trim().length > 0 ? title.trim() : null;
  const date = parseDateFromFrontmatter(parsed.data);

  return {
    title: validTitle,
    date,
    content: parsed.content.trim(),
    data: parsed.data ?? {},
  };
}
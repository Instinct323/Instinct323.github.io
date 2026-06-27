import matter from 'gray-matter';
import { katex } from '@mdit/plugin-katex';
import MarkdownIt from 'markdown-it';
import { getDateTime } from './content-normalize';

export interface RenderMarkdownOptions {
  fileURL?: string;
}

export interface ParseMarkdownResult {
  title: string | null;
  date: Date | null;
  content: string;
  data: Record<string, unknown>;
}

export interface MarkdownRenderer {
  render(_markdown: string): string;
}

/** Resolves relative src/href paths in rendered markdown HTML against a base file URL. */
export function resolveRelativePaths(html: string, fileURL: string): string {
  try {
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

        const resolved = new URL(path, baseURL);
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
  } catch {
    return html;
  }
}

const BASE_MARKDOWN_IT_OPTIONS = {
  html: false,
  xhtmlOut: false,
  breaks: false,
  linkify: false,
  typographer: false,
};

/** Creates a standard MarkdownIt renderer with safe defaults (no HTML, no linkify). */
export function createMarkdownRenderer(): MarkdownRenderer {
  const md = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS);

  return {
    render: (_markdown: string): string => md.render(_markdown),
  };
}

function renderWithRenderer(
  renderer: MarkdownRenderer,
  markdown: string,
  options?: RenderMarkdownOptions,
): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let html = renderer.render(markdown);

  if (options?.fileURL) {
    html = resolveRelativePaths(html, options.fileURL);
  }

  return html;
}

const renderer = createMarkdownRenderer();

/** Renders markdown to HTML using the shared default renderer. */
export function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithRenderer(renderer, markdown, options);
}

const mdWithKatex = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS).use(katex);

/** Renders markdown to HTML with KaTeX math support. */
export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithRenderer(mdWithKatex, markdown, options);
}

function parseDateFromFrontmatter(data: Record<string, unknown> | undefined): Date | null {
  const time = getDateTime(data?.date as Date | string | null);
  return time !== null ? new Date(time) : null;
}

/** Parses a markdown string and extracts frontmatter (title, date, and custom data). */
export function parseMarkdownWithFrontmatter(markdown: string): ParseMarkdownResult {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Invalid markdown input');
  }

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
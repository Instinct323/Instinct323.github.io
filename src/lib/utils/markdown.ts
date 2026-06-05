import matter from 'gray-matter';
import { katex } from '@mdit/plugin-katex';
import MarkdownIt from 'markdown-it';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Shared Utilities
// ============================================================================

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

// ============================================================================
// Renderer Factory
// ============================================================================

export function createMarkdownRenderer(): MarkdownRenderer {
  const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: false,
    linkify: false,
    typographer: false,
  });

  return {
    render: (_markdown: string): string => md.render(_markdown),
  };
}

// ============================================================================
// Basic Markdown Renderer (without KaTeX)
// ============================================================================

const renderer = createMarkdownRenderer();

export function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let html = renderer.render(markdown);

  if (options?.fileURL) {
    html = resolveRelativePaths(html, options.fileURL);
  }

  return html;
}

// ============================================================================
// Markdown with KaTeX Support
// ============================================================================

const mdWithKatex = new MarkdownIt({
  html: false,
  xhtmlOut: false,
  breaks: false,
  linkify: false,
  typographer: false,
}).use(katex);

export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let html = mdWithKatex.render(markdown);

  if (options?.fileURL) {
    html = resolveRelativePaths(html, options.fileURL);
  }

  return html;
}

// ============================================================================
// Frontmatter Parser
// ============================================================================

function parseDateFromFrontmatter(data: Record<string, unknown> | undefined): Date | null {
  if (!data?.date) {
    return null;
  }

  const raw = data.date;

  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  if (typeof raw === 'string') {
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof raw === 'number') {
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

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
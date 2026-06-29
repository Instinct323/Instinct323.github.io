import matter from 'gray-matter';
import { katex } from '@mdit/plugin-katex';
import MarkdownIt from 'markdown-it';
import { getDateTime } from './normalize';
import { BASE_MARKDOWN_IT_OPTIONS, renderWithMd, type RenderMarkdownOptions } from './markdown-config';

export interface ParseMarkdownResult {
  title: string | null;
  date: Date | null;
  content: string;
  data: Record<string, unknown>;
}

const md = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS);

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
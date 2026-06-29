import matter from 'gray-matter';
import { getDateTime } from './normalize';
import { renderMarkdown, renderMarkdownWithKatex, type RenderMarkdownOptions } from './markdown-renderer';

export interface ParseMarkdownResult {
  title: string | null;
  date: Date | null;
  content: string;
  data: Record<string, unknown>;
}

export { renderMarkdown, renderMarkdownWithKatex };
export type { RenderMarkdownOptions };

function parseDateFromFrontmatter(data: Record<string, unknown> | undefined): Date | null {
  const rawDate = data?.date;
  const time = getDateTime(rawDate instanceof Date || typeof rawDate === 'string' ? rawDate : null);
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
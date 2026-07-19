import matter from 'gray-matter';
import { getDateTime } from './normalize';

export interface ParseMarkdownResult {
  title: string | null;
  date: Date | null;
  content: string;
  data: Record<string, unknown>;
}

function parseDateFromFrontmatter(data: Record<string, unknown> | undefined): Date | null {
  const rawDate = data?.date;
  const time = getDateTime(rawDate instanceof Date || typeof rawDate === 'string' ? rawDate : null);
  return time !== null ? new Date(time) : null;
}

export function parseMarkdownWithFrontmatter(markdown: string): ParseMarkdownResult {
  const parsed = matter(markdown);
  const title = parsed.data?.title;
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const validTitle = trimmedTitle || null;
  const date = parseDateFromFrontmatter(parsed.data);

  return {
    title: validTitle,
    date,
    content: parsed.content.trim(),
    data: parsed.data ?? {},
  };
}

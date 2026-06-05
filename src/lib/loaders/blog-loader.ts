import { parseMarkdownWithFrontmatter } from '../utils/markdown';
import { BLOG_POST_MODULES } from './astro-adapter';

export interface BlogPost {
  title: string;
  date: Date | null;
  content: string;
  slug: string;
  baseUrl: string;
  weight: number;
}

function extractSlugFromPath(filePath: string): string {
  const match = filePath.match(/blog\/([^/]+)\/README\.md$/);
  if (!match) {
    throw new Error(`Cannot extract slug from path: ${filePath}`);
  }
  return match[1];
}

/**
 * Extracts a date from a slug string.
 * Supports patterns like "Report-2026-04-06-18-07-08" or "2026-04-06-some-title".
 * Returns null if no recognizable date pattern is found.
 */
export function extractDateFromSlug(slug: string): Date | null {
  // Match YYYY-MM-DD pattern anywhere in the slug
  const dateMatch = slug.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

export function compareBlogPosts(a: BlogPost, b: BlogPost): number {
  if (a.weight !== b.weight) {
    return b.weight - a.weight;
  }
  if (a.date === null && b.date !== null) return -1;
  if (a.date !== null && b.date === null) return 1;
  if (a.date && b.date) {
    return b.date.getTime() - a.date.getTime();
  }
  return a.slug.localeCompare(b.slug);
}

export function loadBlogPosts(): BlogPost[] {
  const entries = Object.entries(BLOG_POST_MODULES);

  if (entries.length === 0) {
    throw new Error('No blog posts found in content/blog/*/README.md');
  }

  const posts: BlogPost[] = [];

  for (const [filePath, content] of entries) {
    const parsed = parseMarkdownWithFrontmatter(content);
    const slug = extractSlugFromPath(filePath);
    const fileURL = new URL(filePath, import.meta.url).href;

    const date = parsed.date ?? extractDateFromSlug(slug) ?? null;
    const weight = typeof parsed.data.weight === 'number' ? parsed.data.weight : 0;
    const title = parsed.title ?? slug;

    posts.push({
      title,
      date,
      content: parsed.content,
      slug,
      baseUrl: fileURL,
      weight,
    });
  }

  posts.sort(compareBlogPosts);

  return posts;
}
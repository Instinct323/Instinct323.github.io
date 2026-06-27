import { parseMarkdownWithFrontmatter } from '../utils/markdown';
import { compareByWeightAndDate } from '../utils/content-normalize';
import { BLOG_POST_MODULES } from './astro-adapter/blog';
import { registerPageLoader } from './page-loader-registry';

export interface BlogPost {
  title: string;
  date: Date | null;
  content: string;
  slug: string;
  baseUrl: string;
  weight: number;
}

/** Extracts the blog post slug from a Vite glob path. Fails fast when the path does not match the expected `blog/{slug}/README.md` pattern, which happens if the glob pattern or file layout changes. */
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

  posts.sort(compareByWeightAndDate);

  return posts;
}

export async function loadBlogPage(): Promise<{ posts: BlogPost[] }> {
  return { posts: loadBlogPosts() };
}

registerPageLoader('blog', { frame: loadBlogPage });
import { BLOG_POST_MODULES } from '~/core/content/astro-adapter/blog';
import { parseBlogPost, sortBlogPosts, type BlogPost } from '~/core/content/blog-post';

export function loadBlogPosts(): BlogPost[] {
  const entries = Object.entries(BLOG_POST_MODULES);

  if (entries.length === 0) {
    throw new Error('No blog posts found in content/blog/*/README.md');
  }

  const posts = entries.map(([filePath, content]) =>
    parseBlogPost(filePath, content, new URL(filePath, import.meta.url).href)
  );

  return sortBlogPosts(posts);
}


import fs from 'node:fs';
import path from 'node:path';
import { sortBlogPosts } from '../src/core/content/blog-post.ts';
import { renderMarkdown } from '../src/core/content/markdown-renderer.ts';
import {
  hasKatexMath,
  renderMarkdownWithKatex,
} from '../src/core/content/markdown-katex-renderer.ts';

export function clearBlogDataOutput(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
}

function createBlogDataFileName(slug) {
  if (
    typeof slug !== 'string' ||
    slug.length === 0 ||
    slug === '.' ||
    slug === '..' ||
    slug.includes('/') ||
    slug.includes('\\') ||
    slug.includes('\0')
  ) {
    throw new Error(`Invalid blog slug: ${JSON.stringify(slug)}`);
  }

  return `${slug}.json`;
}

export function createBlogDataOutput(posts) {
  return sortBlogPosts(posts).map((post) => {
    const hasLatex = hasKatexMath(post.content);
    const render = hasLatex ? renderMarkdownWithKatex : renderMarkdown;

    return {
      fileName: createBlogDataFileName(post.slug),
      data: {
        title: post.title,
        date: post.date,
        html: render(post.content, { fileURL: post.baseUrl }),
        hasLatex,
      },
    };
  });
}

export function writeBlogDataOutput(targetDir, posts) {
  for (const { fileName, data } of createBlogDataOutput(posts)) {
    fs.writeFileSync(path.join(targetDir, fileName), JSON.stringify(data));
  }
}

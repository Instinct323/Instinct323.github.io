/**
 * Build-time script: reads content/blog subdirectories for README.md,
 * parses frontmatter and markdown, and writes public/blog-data JSON
 * files consumed by the blog.astro page. Written as .js because Bun
 * can import .ts directly; no compile step is needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlogPost, sortBlogPosts } from '../src/core/content/blog-post.ts';
import { LATEX_REGEX } from '../src/core/content/blog-data-types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'content', 'blog');
const outputDir = path.join(rootDir, 'public', 'blog-data');
const rootDirUrl = `${rootDir.replace(/\\/g, '/')}/`;

fs.mkdirSync(outputDir, { recursive: true });

if (!fs.existsSync(blogDir)) throw new Error(`Blog content directory not found: ${blogDir}`);

const entries = fs.readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => {
    const slug = d.name;
    const readmePath = path.join(blogDir, slug, 'README.md');
    return { slug, readmePath };
  })
  .filter(({ readmePath }) => fs.existsSync(readmePath));

const posts = [];
for (const { readmePath } of entries) {
  const content = fs.readFileSync(readmePath, 'utf-8');
  const relativePath = path.relative(rootDir, readmePath).replace(/\\/g, '/');
  const baseUrl = new URL(relativePath, `file://${rootDirUrl}`).href;
  posts.push(parseBlogPost(relativePath, content, baseUrl));
}

if (posts.length === 0) console.warn('No blog posts found to generate.');

for (const post of sortBlogPosts(posts)) {
  const data = {
    title: post.title,
    date: post.date,
    content: post.content,
    baseUrl: post.baseUrl,
    hasLatex: LATEX_REGEX.test(post.content),
  };

  fs.writeFileSync(
    path.join(outputDir, `${post.slug}.json`),
    JSON.stringify(data),
  );
}

console.warn(`Generated ${posts.length} blog data files.`);

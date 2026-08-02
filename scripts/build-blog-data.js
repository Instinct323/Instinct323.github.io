/**
 * Build-time script: reads content/blog subdirectories for README.md,
 * parses frontmatter, renders markdown to HTML, and writes public/blog-data
 * JSON files consumed by the browser blog client. Written as .js because Bun
 * can import .ts directly; no compile step is needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlogPost } from '../src/core/content/blog-post.ts';
import { clearBlogDataOutput, writeBlogDataOutput } from './blog-data-output.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'content', 'blog');
const outputDir = path.join(rootDir, 'public', 'blog-data');
const rootDirUrl = `${rootDir.replace(/\\/g, '/')}/`;

function buildBlogData() {
  if (!fs.existsSync(blogDir)) throw new Error(`Blog content directory not found: ${blogDir}`);

  clearBlogDataOutput(outputDir);

  const readmePaths = fs.readdirSync(blogDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(blogDir, d.name, 'README.md'))
    .filter((readmePath) => fs.existsSync(readmePath));

  const posts = [];
  for (const readmePath of readmePaths) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const relativePath = path.relative(rootDir, readmePath).replace(/\\/g, '/');
    const baseUrl = new URL(relativePath, `file://${rootDirUrl}`).href;
    posts.push(parseBlogPost(relativePath, content, baseUrl));
  }

  if (posts.length === 0) console.warn('No blog posts found to generate.');

  writeBlogDataOutput(outputDir, posts);

  console.warn(`Generated ${posts.length} blog data files.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildBlogData();
}

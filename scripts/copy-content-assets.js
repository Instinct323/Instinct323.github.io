import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'content');
const publicDir = join(rootDir, 'public');

function copyContentAssets() {
  if (!existsSync(contentDir)) {
    console.warn('No content directory found');
    return;
  }

  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  const dirsWithMarkdown = findDirectoriesWithMarkdown(contentDir);

  for (const dirPath of dirsWithMarkdown) {
    const relativePath = dirPath.slice(contentDir.length + 1);
    const targetPath = join(publicDir, relativePath);

    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(dirPath, targetPath, { recursive: true });
  }

  if (dirsWithMarkdown.length > 0) {
    console.warn(`Content: ${dirsWithMarkdown.length} dirs`);
  }

  const pubRootDir = join(contentDir, 'pub-root');
  if (existsSync(pubRootDir)) {
    const entryCount = readdirSync(pubRootDir).length;
    cpSync(pubRootDir, publicDir, { recursive: true });

    if (entryCount > 0) {
      console.warn(`Public root: ${entryCount} entries`);
    }
  }
}

function findDirectoriesWithMarkdown(startDir) {
  const results = [];
  const entries = readdirSync(startDir);
  let hasMarkdown = false;

  for (const entry of entries) {
    const fullPath = join(startDir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile() && entry.endsWith('.md')) {
      hasMarkdown = true;
    }
  }

  if (hasMarkdown) {
    results.push(startDir);
  } else {
    for (const entry of entries) {
      const fullPath = join(startDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        const subDirResults = findDirectoriesWithMarkdown(fullPath);
        results.push(...subDirResults);
      }
    }
  }

  return results;
}

copyContentAssets();

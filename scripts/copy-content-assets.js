import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'jsonc-parser';
import { resolveMusicConfig } from '../src/core/config/music.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const contentDir = join(rootDir, 'content');
const publicDir = join(rootDir, 'public');
const siteConfigPath = join(contentDir, 'config.jsonc');

function loadMusicFileName() {
  if (!existsSync(siteConfigPath)) {
    throw new Error('Site config missing: content/config.jsonc');
  }

  const errors = [];
  const config = parse(readFileSync(siteConfigPath, 'utf8'), errors);
  if (errors.length > 0) {
    const details = errors.map(({ offset, error }) => `offset ${offset + 1}: error ${error}`).join('; ');
    throw new SyntaxError(`Invalid content/config.jsonc (${details})`);
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Invalid content/config.jsonc: expected a configuration object');
  }

  return resolveMusicConfig(config.music).fileName;
}

function copyMusicAsset(fileName) {
  const sourcePath = join(contentDir, 'music', fileName);
  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
    throw new Error(`Configured music asset missing: content/music/${fileName}`);
  }

  const targetDir = join(publicDir, 'music');
  const targetPath = join(targetDir, fileName);
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourcePath, targetPath);
}

export function clearContentAssetOutputs(targetPublicDir) {
  if (!existsSync(targetPublicDir)) {
    mkdirSync(targetPublicDir, { recursive: true });
    return;
  }

  for (const entry of readdirSync(targetPublicDir)) {
    if (entry !== 'blog-data') {
      rmSync(join(targetPublicDir, entry), { recursive: true, force: true });
    }
  }
}

function copyContentAssets() {
  const musicFileName = loadMusicFileName();
  if (!existsSync(contentDir)) {
    throw new Error('Content directory missing: content');
  }

  const dirsWithMarkdown = findDirectoriesWithMarkdown(contentDir);
  clearContentAssetOutputs(publicDir);

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

  copyMusicAsset(musicFileName);
  console.warn('Configured music asset: 1 file');
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  copyContentAssets();
}

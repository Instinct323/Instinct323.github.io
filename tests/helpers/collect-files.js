import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function collectFiles(dirPath, extensions) {
  const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of dirEntries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...await collectFiles(entryPath, extensions));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      results.push(entryPath);
    }
  }

  return results;
}

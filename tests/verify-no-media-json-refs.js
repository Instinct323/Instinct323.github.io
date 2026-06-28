import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFiles } from './helpers/collect-files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCAN_TARGETS = [
  path.join(ROOT_DIR, 'src'),
  path.join(ROOT_DIR, 'content', 'about'),
];
const TEXT_FILE_EXTENSIONS = new Set(['.astro', '.js', '.json', '.jsonc', '.md', '.mjs', '.ts']);
const MEDIA_JSON_REF_PATTERN = /(?:content\/media\/[^\s'"`)]+\.json|['"`][^'"`\n]*media[^'"`\n]*\.json['"`])/g;

async function main() {
  const files = (await Promise.all(SCAN_TARGETS.map((d) => collectFiles(d, TEXT_FILE_EXTENSIONS)))).flat();
  const violations = [];

  for (const file_path of files) {
    const content = await fs.readFile(file_path, 'utf8');
    const matches = content.match(MEDIA_JSON_REF_PATTERN);

    if (!matches) {
      continue;
    }

    violations.push({
      file_path,
      matches: [...new Set(matches)],
    });
  }

  if (violations.length === 0) {
    return;
  }

  for (const violation of violations) {
    const relative_path = path.relative(ROOT_DIR, violation.file_path);
    console.error(`Unexpected media JSON reference in ${relative_path}: ${violation.matches.join(', ')}`);
  }

  process.exitCode = 1;
}

await main();

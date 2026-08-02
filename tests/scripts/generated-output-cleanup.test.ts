import { afterEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  createBlogDataOutput,
  clearBlogDataOutput,
  writeBlogDataOutput,
} from '../../scripts/blog-data-output.js';
import { clearContentAssetOutputs } from '../../scripts/copy-content-assets.js';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'instinct-output-cleanup-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeFixtureFile(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, 'fixture');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('generated output cleanup', () => {
  it('clears all stale blog data before regeneration', () => {
    const outputDir = join(createTemporaryDirectory(), 'public', 'blog-data');
    writeFixtureFile(join(outputDir, 'stale.json'));
    writeFixtureFile(join(outputDir, 'old', 'nested.json'));

    clearBlogDataOutput(outputDir);

    expect(existsSync(outputDir)).toBe(true);
    expect(readdirSync(outputDir)).toEqual([]);
  });

  it('publishes sorted blog data without mutating source posts', () => {
    const outputDir = join(createTemporaryDirectory(), 'public', 'blog-data');
    writeFixtureFile(join(outputDir, 'stale', 'old.json'));
    const posts = [
      {
        title: 'Older',
        date: new Date('2025-01-01T00:00:00.000Z'),
        content: 'Plain markdown',
        slug: 'older',
        baseUrl: 'file:///content/blog/older/README.md',
        weight: 0,
      },
      {
        title: 'Pinned',
        date: new Date('2024-01-01T00:00:00.000Z'),
        content: 'Inline math $x + y$',
        slug: 'pinned',
        baseUrl: 'file:///content/blog/pinned/README.md',
        weight: 10,
      },
    ];
    const originalOrder = posts.map(({ slug }) => slug);

    expect(createBlogDataOutput(posts).map(({ fileName }) => fileName)).toEqual([
      'pinned.json',
      'older.json',
    ]);

    clearBlogDataOutput(outputDir);
    writeBlogDataOutput(outputDir, posts);

    expect(posts.map(({ slug }) => slug)).toEqual(originalOrder);
    expect(existsSync(join(outputDir, 'stale', 'old.json'))).toBe(false);
    expect(readdirSync(outputDir).sort()).toEqual(['older.json', 'pinned.json']);
    const pinnedData = JSON.parse(readFileSync(join(outputDir, 'pinned.json'), 'utf-8'));
    expect(pinnedData).toEqual({
      title: 'Pinned',
      date: '2024-01-01T00:00:00.000Z',
      html: expect.stringContaining('class="katex"'),
      hasLatex: true,
    });
    expect(pinnedData).not.toHaveProperty('content');
    expect(pinnedData).not.toHaveProperty('baseUrl');
    expect(JSON.parse(readFileSync(join(outputDir, 'older.json'), 'utf-8'))).toEqual({
      title: 'Older',
      date: '2025-01-01T00:00:00.000Z',
      html: '<p>Plain markdown</p>\n',
      hasLatex: false,
    });
  });

  it('rejects blog slugs that escape the output directory', () => {
    const rootDir = createTemporaryDirectory();
    const outputDir = join(rootDir, 'public', 'blog-data');
    clearBlogDataOutput(outputDir);

    expect(() => writeBlogDataOutput(outputDir, [{
      title: 'Escape',
      date: null,
      content: 'Unsafe path',
      slug: '../escape',
      baseUrl: 'file:///content/blog/escape/README.md',
      weight: 0,
    }])).toThrow('Invalid blog slug: "../escape"');
    expect(existsSync(join(rootDir, 'public', 'escape.json'))).toBe(false);
  });

  it('removes stale content outputs while preserving blog data', () => {
    const publicDir = join(createTemporaryDirectory(), 'public');
    writeFixtureFile(join(publicDir, 'blog-data', 'post.json'));
    writeFixtureFile(join(publicDir, 'about', 'introduction.md'));
    writeFixtureFile(join(publicDir, 'music', 'old.ogg'));
    writeFixtureFile(join(publicDir, 'stale-root.txt'));

    clearContentAssetOutputs(publicDir);

    expect(readdirSync(publicDir)).toEqual(['blog-data']);
    expect(existsSync(join(publicDir, 'blog-data', 'post.json'))).toBe(true);
  });
});

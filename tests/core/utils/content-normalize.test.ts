import { describe, expect, it } from 'vitest';
import {
  compareNatural,
  filenameWithoutExt,
  stripNumericPrefix,
  folderNameToSlug,
  slugToTitle,
  sanitizePositiveWidths,
  parseNumericAttr,
} from '~/core/content/normalize';

describe('compareNatural', () => {
  it('sorts strings with numeric suffixes naturally', () => {
    const input = ['file10.txt', 'file2.txt', 'file1.txt'];
    const sorted = [...input].sort(compareNatural);
    expect(sorted).toEqual(['file1.txt', 'file2.txt', 'file10.txt']);
  });

  it('returns 0 for equal strings', () => {
    expect(compareNatural('abc', 'abc')).toBe(0);
  });

  it('returns negative when a < b', () => {
    expect(compareNatural('abc', 'def')).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compareNatural('def', 'abc')).toBeGreaterThan(0);
  });

  it('handles mixed alphanumeric', () => {
    const input = ['a1b', 'a01b', 'a2b'];
    const sorted = [...input].sort(compareNatural);
    expect(sorted).toEqual(['a1b', 'a01b', 'a2b']);
  });
});

describe('filenameWithoutExt', () => {
  it('removes file extension', () => {
    expect(filenameWithoutExt('document.pdf')).toBe('document');
  });

  it('handles multiple dots in filename', () => {
    expect(filenameWithoutExt('my.document.final.pdf')).toBe('my.document.final');
  });

  it('returns filename unchanged if no extension', () => {
    expect(filenameWithoutExt('README')).toBe('README');
  });

  it('handles hidden files (extension stripped)', () => {
    expect(filenameWithoutExt('.bashrc')).toBe('');
  });

  it('handles filename with only extension', () => {
    expect(filenameWithoutExt('.pdf')).toBe('');
  });
});

describe('stripNumericPrefix', () => {
  it('removes numeric prefix', () => {
    expect(stripNumericPrefix('123-my-file')).toBe('my-file');
  });

  it('returns original if no numeric prefix', () => {
    expect(stripNumericPrefix('my-file')).toBe('my-file');
  });

  it('handles prefix with only numbers', () => {
    expect(stripNumericPrefix('456')).toBe('456');
  });

  it('handles prefix at start with dash', () => {
    expect(stripNumericPrefix('001-intro')).toBe('intro');
  });

  it('handles empty string', () => {
    expect(stripNumericPrefix('')).toBe('');
  });

  it('handles single digit prefix', () => {
    expect(stripNumericPrefix('1-file')).toBe('file');
  });
});

describe('folderNameToSlug', () => {
  it('converts folder name to lowercase slug', () => {
    expect(folderNameToSlug('My Folder')).toBe('my-folder');
  });

  it('removes numeric prefix before converting', () => {
    expect(folderNameToSlug('123-My Folder')).toBe('my-folder');
  });

  it('replaces spaces and underscores with hyphens', () => {
    expect(folderNameToSlug('my_folder name')).toBe('my-folder-name');
  });

  it('collapses multiple hyphens', () => {
    expect(folderNameToSlug('my  --  folder')).toBe('my-folder');
  });

  it('handles already slugified input', () => {
    expect(folderNameToSlug('already-slugified')).toBe('already-slugified');
  });

  it('trims whitespace', () => {
    expect(folderNameToSlug('  my folder  ')).toBe('my-folder');
  });
});

describe('slugToTitle', () => {
  it('converts slug to title case', () => {
    expect(slugToTitle('hello-world')).toBe('Hello World');
  });

  it('handles underscores as separators', () => {
    expect(slugToTitle('hello_world')).toBe('Hello World');
  });

  it('handles mixed separators', () => {
    expect(slugToTitle('hello-world_and_more')).toBe('Hello World And More');
  });

  it('capitalizes each word', () => {
    expect(slugToTitle('the-quick-brown-fox')).toBe('The Quick Brown Fox');
  });

  it('removes empty parts', () => {
    expect(slugToTitle('hello--world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(slugToTitle('hello')).toBe('Hello');
  });
});

describe('sanitizePositiveWidths', () => {
  it('filters and sorts positive widths', () => {
    expect(sanitizePositiveWidths([300, 100, 200])).toEqual([100, 200, 300]);
  });

  it('removes duplicates', () => {
    expect(sanitizePositiveWidths([100, 100, 200, 200])).toEqual([100, 200]);
  });

  it('filters out non-finite values', () => {
    expect(sanitizePositiveWidths([100, NaN, Infinity, 200])).toEqual([100, 200]);
  });

  it('filters out non-positive values', () => {
    expect(sanitizePositiveWidths([100, 0, -50, 200])).toEqual([100, 200]);
  });

  it('rounds floating point values', () => {
    expect(sanitizePositiveWidths([100.7, 100.2, 100.5])).toEqual([100, 101]);
  });

  it('returns empty array for undefined', () => {
    expect(sanitizePositiveWidths(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(sanitizePositiveWidths('not an array' as any)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(sanitizePositiveWidths([])).toEqual([]);
  });

  it('handles mixed valid and invalid values', () => {
    expect(sanitizePositiveWidths([100, -5, NaN, 200, 0, 150.9])).toEqual([100, 151, 200]);
  });
});

describe('parseNumericAttr', () => {
  it('returns fallback when value is null', () => {
    expect(parseNumericAttr(null, 0)).toBe(0);
  });

  it('returns parsed integer value when valid', () => {
    expect(parseNumericAttr('42', 0)).toBe(42);
  });

  it('returns fallback when value is invalid', () => {
    expect(parseNumericAttr('invalid', 0)).toBe(0);
  });

  it('returns parsed float value when float option is true', () => {
    expect(parseNumericAttr('3.5', 0, { float: true })).toBe(3.5);
  });

  it('returns parsed negative float value when float option is true', () => {
    expect(parseNumericAttr('-1', 0, { float: true })).toBe(-1);
  });
});
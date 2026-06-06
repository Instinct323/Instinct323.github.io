import { describe, expect, it } from 'vitest';
import { compareBlogPosts, extractDateFromSlug } from '../../../src/lib/loaders/blog-loader';

// extractDateFromSlug is tested in isolation since loadBlogPosts
// depends on import.meta.glob which is only available at build time.

describe('extractDateFromSlug', () => {
  it('extracts date from slug with YYYY-MM-DD pattern', () => {
    const result = extractDateFromSlug('Report-2026-04-06-18-07-08');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(3);
    expect(result!.getDate()).toBe(6);
  });

  it('extracts date from slug with date prefix', () => {
    const result = extractDateFromSlug('2025-12-25-christmas-special');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(11);
    expect(result!.getDate()).toBe(25);
  });

  it('returns null when slug has no date pattern', () => {
    const result = extractDateFromSlug('opencode-config');
    expect(result).toBeNull();
  });

  it('returns null for empty slug', () => {
    const result = extractDateFromSlug('');
    expect(result).toBeNull();
  });

  it('extracts first date match when multiple patterns exist', () => {
    const result = extractDateFromSlug('2024-01-01-to-2024-12-31');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(0);
    expect(result!.getDate()).toBe(1);
  });
});

describe('compareBlogPosts', () => {
  it('sorts by weight descending', () => {
    const a = { title: 'A', date: null, content: '', slug: 'a', baseUrl: '', weight: 5 };
    const b = { title: 'B', date: null, content: '', slug: 'b', baseUrl: '', weight: 3 };
    expect(compareBlogPosts(a, b)).toBeLessThan(0); // a (weight 5) comes before b (weight 3)
  });

  it('places null dates before non-null dates at same weight', () => {
    const a = { title: 'A', date: null, content: '', slug: 'a', baseUrl: '', weight: 0 };
    const b = { title: 'B', date: new Date('2024-01-01'), content: '', slug: 'b', baseUrl: '', weight: 0 };
    expect(compareBlogPosts(a, b)).toBeLessThan(0); // null date comes first
  });

  it('sorts by date descending when weights are equal', () => {
    const a = { title: 'A', date: new Date('2024-02-01'), content: '', slug: 'a', baseUrl: '', weight: 0 };
    const b = { title: 'B', date: new Date('2024-01-01'), content: '', slug: 'b', baseUrl: '', weight: 0 };
    expect(compareBlogPosts(a, b)).toBeLessThan(0); // Feb comes before Jan
  });

  it('uses slug as tiebreaker for same weight and null dates', () => {
    const a = { title: 'A', date: null, content: '', slug: 'a', baseUrl: '', weight: 0 };
    const b = { title: 'B', date: null, content: '', slug: 'b', baseUrl: '', weight: 0 };
    expect(compareBlogPosts(a, b)).toBeLessThan(0); // 'a' comes before 'b'
  });

  it('returns 0 for identical posts', () => {
    const a = { title: 'A', date: null, content: '', slug: 'a', baseUrl: '', weight: 0 };
    const b = { title: 'A', date: null, content: '', slug: 'a', baseUrl: '', weight: 0 };
    expect(compareBlogPosts(a, b)).toBe(0);
  });
});
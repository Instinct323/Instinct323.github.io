/**
 * Blog post modules glob with raw content
 */
export const BLOG_POST_MODULES = import.meta.glob<string>(
  '../../../../content/blog/*/README.md',
  { eager: true, query: '?raw', import: 'default' }
);

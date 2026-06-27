import type { Publication } from '../../../types/site';

/**
 * Publication modules glob for about/publication JSON files
 */
export const PUBLICATION_MODULES = import.meta.glob<{ default: Publication }>(
  '../../../../content/about/publication/*.json',
  { eager: true }
);

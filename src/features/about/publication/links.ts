import { slugToTitle } from '~/core/content/normalize';
import type { Publication } from '~/features/about/publication/types';

/** A publication link entry with display label. */
export interface PublicationLinkEntry {
  name: string;
  href: string;
  label: string;
}

/**
 * Converts a link name to title case, normalizing `-`, `_`, and spaces.
 */
export function formatPublicationLinkLabel(name: string): string {
  return slugToTitle(name.trim().replace(/[\s_]+/g, '-'));
}

/**
 * Returns link entries for a publication, sorted alphabetically by name.
 */
export function resolvePublicationLinks(publication: Publication): PublicationLinkEntry[] {
  return Object.entries(publication.links ?? {})
    .map(([name, href]) => {
      const normalizedName = name.trim();
      return {
        name: normalizedName,
        href: href.trim(),
        label: formatPublicationLinkLabel(normalizedName),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

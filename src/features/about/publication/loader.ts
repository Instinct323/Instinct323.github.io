import { PUBLICATION_MODULES } from '~/core/content/astro-adapter/publications';
import { compareByWeightAndDate } from '~/core/content/normalize';
import type { Publication } from '~/features/about/publication/types';
import { normalizePublication } from './normalize';

/** Sorts publications by author rank weight, then date, then title without mutating input. */
export function sortPublicationsByAuthor(
  publications: Publication[],
  authorName: string,
): Publication[] {
  const rank = (publication: Publication): number => {
    const index = publication.authors.indexOf(authorName);
    return index >= 0 ? -index : Number.MIN_SAFE_INTEGER;
  };

  return [...publications].sort((a, b) =>
    compareByWeightAndDate(
      { weight: rank(a), date: a.date, slug: a.title },
      { weight: rank(b), date: b.date, slug: b.title },
    )
  );
}

/** Loads, normalizes, and sorts publication modules for an author. */
export function loadPublications(authorName: string): Publication[] {
  const publications = Object.entries(PUBLICATION_MODULES)
    .map(([filePath, mod]) => normalizePublication(mod.default, filePath));

  return sortPublicationsByAuthor(publications, authorName);
}

import type { Publication } from '~/features/about/publication/types';
import { assertFiniteNumber, assertObject, assertString } from '~/core/validation/assert';

interface RawPublication {
  title?: unknown;
  abstract?: unknown;
  authors?: unknown;
  date?: unknown;
  source?: unknown;
  links?: unknown;
  video?: unknown;
  weight?: unknown;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
}

function assertAuthors(value: unknown, filePath: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid publication field "authors" in ${filePath}`);
  }

  return value.map((author, index) =>
    assertString(author, `publication field "authors" in ${filePath}[${index}]`),
  );
}

function normalizePublicationLinks(raw: RawPublication): Record<string, string> | undefined {
  if (!raw.links || typeof raw.links !== 'object' || Array.isArray(raw.links)) {
    return undefined;
  }

  const links = Object.entries(raw.links)
    .map(([name, href]) => {
      if (typeof href !== 'string') {
        return null;
      }

      const normalizedName = name.trim();
      const normalizedHref = href.trim();
      if (!normalizedName || !normalizedHref) {
        return null;
      }

      return [normalizedName, normalizedHref] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  if (links.length === 0) {
    return undefined;
  }

  return Object.fromEntries(links);
}

/**
 * Normalizes raw publication data into a validated `Publication` object.
 *
 * @throws {Error} When required fields are missing or invalid.
 */
export function normalizePublication(rawValue: unknown, filePath: string): Publication {
  const raw = assertObject<RawPublication>(rawValue, 'publication content');
  const title = assertString(raw.title, 'title');
  const date = assertString(raw.date, 'date');

  const publication: Publication = {
    title,
    date,
    authors: assertAuthors(raw.authors, filePath),
    abstract: normalizeOptionalString(raw.abstract),
    source: normalizeOptionalString(raw.source),
    video: normalizeOptionalString(raw.video),
    links: normalizePublicationLinks(raw),
  };

  if (raw.weight !== undefined) {
    publication.weight = assertFiniteNumber(raw.weight, 'weight');
  }

  return publication;
}

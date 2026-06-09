import type { Publication } from '../../types/site';
import { assertString } from '../utils/assertions';
import { wordsToTitle } from '../utils/content-normalize';

interface RawPublication {
  title?: unknown;
  abstract?: unknown;
  authors?: unknown;
  date?: unknown;
  source?: unknown;
  links?: unknown;
  weight?: unknown;
}

function assertNonEmptyString(value: unknown, key: string, filePath: string): string {
  try {
    return assertString(value, key);
  } catch {
    throw new Error(`Invalid publication field "${key}" in ${filePath}`);
  }
}

function assertAuthors(value: unknown, filePath: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid publication field "authors" in ${filePath}`);
  }

  return value.map((author) => {
    if (typeof author !== 'string' || !author.trim()) {
      throw new Error(`Invalid publication field "authors" in ${filePath}: expected non-empty strings`);
    }
    return author.trim();
  });
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
    .filter((entry): entry is readonly [string, string] => Boolean(entry))
    // Links are sorted in canonical order here (used by resolvePublicationLinks)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'en'));

  if (links.length === 0) {
    return undefined;
  }

  return Object.fromEntries(links);
}

export function normalizePublication(rawValue: unknown, filePath: string): Publication {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    throw new Error(`Invalid publication content in ${filePath}`);
  }

  const raw = rawValue as RawPublication;
  const title = assertNonEmptyString(raw.title, 'title', filePath);
  const date = assertNonEmptyString(raw.date, 'date', filePath);

  const publication: Publication = {
    title,
    date,
    authors: assertAuthors(raw.authors, filePath),
    abstract: typeof raw.abstract === 'string' && raw.abstract.trim() ? raw.abstract.trim() : undefined,
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source.trim() : undefined,
    links: normalizePublicationLinks(raw),
  };

  if (typeof raw.weight === 'number') {
    publication.weight = raw.weight;
  }

  return publication;
}

export interface PublicationLinkEntry {
  name: string;
  href: string;
  label: string;
}

export function formatPublicationLinkLabel(name: string): string {
  return wordsToTitle(name.trim().replace(/[\s_]+/g, '-').split('-'));
}

export function resolvePublicationLinks(publication: Publication): PublicationLinkEntry[] {
  return Object.entries(publication.links ?? {})
    .filter(([name, href]) => Boolean(name.trim() && href.trim()))
    .map(([name, href]) => {
      const normalizedName = name.trim();
      return {
        name: normalizedName,
        href: href.trim(),
        label: formatPublicationLinkLabel(normalizedName),
      };
    });
}

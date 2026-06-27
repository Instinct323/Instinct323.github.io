import type { Publication } from '../../types/site';
import { assertFiniteNumber, assertObject, assertString } from '../utils/assertions';
import { slugToTitle } from '../utils/content-normalize';

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
;

  if (links.length === 0) {
    return undefined;
  }

  return Object.fromEntries(links);
}

/**
 * Normalizes raw publication data into a validated `Publication` object.
 *
 * @param rawValue - Raw publication data from JSON/YAML.
 * @param filePath - Source file path for error messages.
 * @returns A validated Publication object.
 * @throws {Error} When required fields are missing or invalid.
 */
export function normalizePublication(rawValue: unknown, filePath: string): Publication {
  try {
    assertObject(rawValue, 'publication content');
  } catch {
    throw new Error(`Invalid publication content in ${filePath}`);
  }

  const raw = rawValue as RawPublication;
  const title = assertString(raw.title, 'title');
  const date = assertString(raw.date, 'date');

  const publication: Publication = {
    title,
    date,
    authors: assertAuthors(raw.authors, filePath),
    abstract: typeof raw.abstract === 'string' && raw.abstract.trim() ? raw.abstract.trim() : undefined,
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source.trim() : undefined,
    video: typeof raw.video === 'string' && raw.video.trim() ? raw.video.trim() : undefined,
    links: normalizePublicationLinks(raw),
  };

  if (raw.weight !== undefined) {
    try {
      publication.weight = assertFiniteNumber(raw.weight, 'weight');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid publication field "weight" in ${filePath}: ${message}`);
    }
  }

  return publication;
}

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
    .filter(([name, href]) => Boolean(name.trim() && href.trim()))
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

/**
 * Resolves a video page URL to its base embed URL.
 *
 * Supported platforms:
 * - Bilibili: `https://www.bilibili.com/video/BV...` → `https://player.bilibili.com/player.html?bvid=...`
 * - YouTube watch: `https://www.youtube.com/watch?v=...` → `https://www.youtube.com/embed/...`
 * - YouTube short: `https://youtu.be/...` → `https://www.youtube.com/embed/...`
 * - Already-embed URLs are passed through as-is.
 *
 * @param videoUrl - The raw video URL from publication content.
 * @returns The base embed URL, or `undefined` if the URL is unsupported or malformed.
 */
export function resolveEmbedUrl(videoUrl: string): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'player.bilibili.com') {
      return url.toString();
    }

    if ((hostname === 'www.youtube.com' || hostname === 'youtube.com') && url.pathname.startsWith('/embed/')) {
      return url.toString();
    }

    // Bilibili video page → embed
    const bilibiliMatch = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
    if (bilibiliMatch) {
      return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1&high_quality=1`;
    }

    // YouTube watch URL → embed
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      const videoId = url.searchParams.get('v');
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // YouTube short URL (youtu.be) → embed
    if (hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return undefined;
  } catch {
    if (import.meta.env?.DEV) {
      console.warn(`[resolveEmbedUrl] malformed video URL: ${videoUrl}`);
    }
    return undefined;
  }
}

/**
 * Builds a video embed URL with player behavior parameters.
 *
 * Calls {@link resolveEmbedUrl} to get the base embed URL, then appends
 * autoplay/loop/mute parameters appropriate for each platform.
 *
 * @param videoUrl - The raw video URL from publication content.
 * @returns The embed URL with behavior parameters, or `undefined` if unsupported.
 */
export function buildVideoEmbedUrl(videoUrl: string): string | undefined {
  const baseUrl = resolveEmbedUrl(videoUrl);
  if (!baseUrl) return undefined;

  const url = new URL(baseUrl);
  if (url.hostname === 'player.bilibili.com') {
    url.searchParams.set('autoplay', '1');
    return url.toString();
  }
  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
    const videoId = url.pathname.split('/embed/')[1];
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('loop', '1');
    url.searchParams.set('mute', '1');
    if (videoId) {
      url.searchParams.set('playlist', videoId);
    }
    return url.toString();
  }
  return baseUrl;
}

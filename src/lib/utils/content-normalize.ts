const NUMERIC_PREFIX_PATTERN = /^\d+-(.+)$/;

export function compareNatural(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function filenameWithoutExt(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

export function stripNumericPrefix(name: string): string {
  const match = name.match(NUMERIC_PREFIX_PATTERN);
  return match ? match[1] : name;
}

export function folderNameToSlug(name: string): string {
  return stripNumericPrefix(name)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function wordsToTitle(segments: string[]): string {
  return segments
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function slugToTitle(slug: string): string {
  return wordsToTitle(slug.split(/[-_]/));
}

export function sanitizePositiveWidths(widths: number[] | undefined): number[] {
  if (!Array.isArray(widths)) {
    return [];
  }

  return Array.from(
    new Set(
      widths
        .map(width => Math.round(width))
        .filter(width => Number.isFinite(width) && width > 0)
    )
  ).sort((a, b) => a - b);
}

export function parseNumericAttr(
  value: string | null,
  fallback: number,
  options?: { float?: boolean }
): number {
  if (value === null) return fallback;
  const parsed = options?.float
    ? Number.parseFloat(value)
    : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface WeightedContent {
  weight: number;
  date: Date | string | null;
  slug: string;
}

function getDateTime(date: Date | string | null): number | null {
  if (date === null) return null;
  if (date instanceof Date) return date.getTime();
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

/**
 * Sorts weighted content by: weight descending, null dates before non-null dates,
 * then by date descending, and finally by slug as a tiebreaker.
 */
export function compareByWeightAndDate(a: WeightedContent, b: WeightedContent): number {
  if (a.weight !== b.weight) {
    return b.weight - a.weight;
  }
  const timeA = getDateTime(a.date);
  const timeB = getDateTime(b.date);
  if (timeA === null && timeB !== null) return -1;
  if (timeA !== null && timeB === null) return 1;
  if (timeA !== null && timeB !== null) {
    return timeB - timeA;
  }
  return a.slug.localeCompare(b.slug);
}

export interface ProfileFact {
  id: string;
  value: string;
}

/** Trims whitespace from profile fact IDs and values so downstream rendering does not inherit accidental padding from config files. */
export function trimProfileFacts(facts: ProfileFact[]): ProfileFact[] {
  return facts.map((fact) => ({
    id: fact.id.trim(),
    value: fact.value.trim(),
  }));
}

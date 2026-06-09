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

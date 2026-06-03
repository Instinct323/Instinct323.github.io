export const IMAGE_MEDIUM_WIDTHS_KEY = 'image.widths.medium';
export const IMAGE_HIGH_WIDTHS_KEY = 'image.widths.high';

export interface CandidateWidthPolicyInput {
  candidateWidths: number[];
  inferredWidths: number[];
  dprScale: number;
  key: string;
  maxSelectableWidth?: number;
}

export function assertPositiveScale(value: unknown, key: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${key}: expected a positive number.`);
  }
  return value;
}

export function assertStrictlyIncreasingPositiveWidths(widths: unknown, key: string): number[] {
  if (!Array.isArray(widths) || widths.length === 0) {
    throw new Error(`Invalid ${key}: expected a non-empty array of strictly increasing positive numbers.`);
  }

  let previous = 0;

  return widths.map((width, index) => {
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
      throw new Error(`Invalid ${key}[${index}]: expected a positive number, received ${String(width)}.`);
    }

    if (width <= previous) {
      throw new Error(`Invalid ${key}: expected a strictly increasing list of positive numbers.`);
    }

    previous = width;
    return width;
  });
}

function normalizeInferredWidths(inferredWidths: number[], key: string): number[] {
  return assertStrictlyIncreasingPositiveWidths(
    Array.from(new Set(inferredWidths)).sort((a, b) => a - b),
    `${key}.inferredWidths`,
  );
}

function computeScaledTargetWidth(inferredWidths: number[], dprScale: number): number {
  return Math.ceil(Math.max(...inferredWidths) * dprScale);
}

function selectSingleBucket(candidateWidths: number[], targetWidth: number): number {
  const matched = candidateWidths.find((candidateWidth) => candidateWidth >= targetWidth);
  return matched ?? candidateWidths[candidateWidths.length - 1];
}

function normalizeCandidateWidths(
  candidateWidths: number[],
  key: string,
  maxSelectableWidth?: number,
): number[] {
  const normalizedCandidates = assertStrictlyIncreasingPositiveWidths(candidateWidths, key);

  if (maxSelectableWidth === undefined) {
    return normalizedCandidates;
  }

  const normalizedMax = assertPositiveScale(maxSelectableWidth, `${key}.maxSelectableWidth`);
  const bounded = normalizedCandidates.filter((candidateWidth) => candidateWidth <= normalizedMax);

  if (bounded.length > 0) {
    return bounded;
  }

  throw new Error(`Invalid ${key}: no candidate width is <= maxSelectableWidth (${normalizedMax}).`);
}

export function selectCandidateWidthsByPolicy(input: CandidateWidthPolicyInput): number[] {
  const {
    candidateWidths,
    inferredWidths,
    dprScale,
    key,
    maxSelectableWidth,
  } = input;

  const normalizedScale = assertPositiveScale(dprScale, `${key}.dprScale`);
  const normalizedCandidates = normalizeCandidateWidths(candidateWidths, key, maxSelectableWidth);
  const normalizedInferred = normalizeInferredWidths(inferredWidths, key);
  const targetWidth = computeScaledTargetWidth(normalizedInferred, normalizedScale);
  const selected = selectSingleBucket(normalizedCandidates, targetWidth);

  return [selected];
}
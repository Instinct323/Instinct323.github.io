import {
  IMAGE_HIGH_WIDTHS_KEY,
  selectCandidateWidthsByPolicy,
} from './image-width-utils';

export const LAYOUT_MOBILE_HEIGHT = 812;
export const LAYOUT_DESKTOP_HEIGHT = 900;

/**
 * Selects the optimal background image width from candidates using the
 * high-width policy. The `keySuffix` scopes the policy cache key so
 * different surfaces (e.g. mobile vs desktop backgrounds) maintain
 * independent width selections.
 */
export function selectBackgroundWidth(
  candidateWidths: number[],
  inferredWidth: number,
  dprScale: number,
  keySuffix: string,
  sourceMaxWidth: number,
): number {
  return selectCandidateWidthsByPolicy({
    candidateWidths,
    inferredWidths: [inferredWidth],
    dprScale,
    key: `${IMAGE_HIGH_WIDTHS_KEY}.${keySuffix}`,
    maxSelectableWidth: sourceMaxWidth,
  })[0];
}

/**
 * Infers the minimum image width needed for a CSS `cover`-like fill.
 * When the image is wider (larger aspect ratio) than the viewport, the
 * crop expands horizontally to avoid blank edges after the centered
 * cover crop. The expansion factor is the ratio of image aspect to
 * viewport aspect, clamped to 1 so we never shrink.
 */
export function inferCoverWidth(
  viewportWidth: number,
  viewportHeight: number,
  imageAspectRatio: number,
): number {
  const viewportAspectRatio = viewportWidth / viewportHeight;
  const cropExpansion = Math.max(1, imageAspectRatio / viewportAspectRatio);
  return Math.ceil(viewportWidth * cropExpansion);
}

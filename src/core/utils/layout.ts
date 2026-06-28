export const LAYOUT_MOBILE_HEIGHT = 812;
export const LAYOUT_DESKTOP_HEIGHT = 900;

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

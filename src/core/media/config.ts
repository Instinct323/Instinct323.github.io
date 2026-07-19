import { assertStrictlyIncreasingPositiveWidths, IMAGE_MEDIUM_WIDTHS_KEY, IMAGE_HIGH_WIDTHS_KEY } from '~/core/media/sizing';
import { assertObject, assertPositiveScale } from '~/core/validation/assert';
import type { MediaConfig } from '~/features/site/types';

export function assertMediaConfigShape(config: unknown): void {
  const mediaConfig = assertObject<Partial<MediaConfig>>(config, 'media');

  if (!mediaConfig.grid?.columns || !mediaConfig.image || !mediaConfig.homepage?.carousel) {
    throw new Error('Invalid site config: missing media grid/image/carousel settings.');
  }

  assertStrictlyIncreasingPositiveWidths(mediaConfig.image.widths?.medium, IMAGE_MEDIUM_WIDTHS_KEY);
  assertStrictlyIncreasingPositiveWidths(mediaConfig.image.widths?.high, IMAGE_HIGH_WIDTHS_KEY);

  assertPositiveScale(mediaConfig.image.dprScale?.low, 'image.dprScale.low');
  assertPositiveScale(mediaConfig.image.dprScale?.medium, 'image.dprScale.medium');
  assertPositiveScale(mediaConfig.image.dprScale?.high, 'image.dprScale.high');
}

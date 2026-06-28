import { assertStrictlyIncreasingPositiveWidths, IMAGE_MEDIUM_WIDTHS_KEY, IMAGE_HIGH_WIDTHS_KEY } from '~/core/media/sizing';
import { assertPositiveScale } from '~/core/validation/assert';
import type { MediaConfig } from '~/features/site/types';

export function assertMediaConfigShape(config: MediaConfig): void {
  if (!config.grid?.columns || !config.image || !config.homepage?.carousel) {
    throw new Error('Invalid site config: missing media grid/image/carousel settings.');
  }

  assertStrictlyIncreasingPositiveWidths(config.image.widths?.medium, IMAGE_MEDIUM_WIDTHS_KEY);
  assertStrictlyIncreasingPositiveWidths(config.image.widths?.high, IMAGE_HIGH_WIDTHS_KEY);

  assertPositiveScale(config.image.dprScale?.low, 'image.dprScale.low');
  assertPositiveScale(config.image.dprScale?.medium, 'image.dprScale.medium');
  assertPositiveScale(config.image.dprScale?.high, 'image.dprScale.high');
}

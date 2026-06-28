import { getImage } from 'astro:assets';
import { backgroundDesktopSource, backgroundMobileSource } from '~/core/content/astro-adapter/assets';
import {
  IMAGE_HIGH_WIDTHS_KEY,
  RESPONSIVE_VIEWPORT_WIDTHS,
  selectCandidateWidthsByPolicy,
} from '~/core/media/sizing';
import {
  inferCoverWidth,
  LAYOUT_DESKTOP_HEIGHT,
  LAYOUT_MOBILE_HEIGHT,
} from '~/core/utils/layout';
import type { MediaConfig } from '~/features/site/types';

type BackgroundVariantKey = 'mobile' | 'desktop';

interface BackgroundVariantInput {
  key: BackgroundVariantKey;
  source: typeof backgroundMobileSource;
  inferredWidth: number;
  aspectRatio: number;
}

export interface LayoutBackgroundData {
  backgroundMobile: Awaited<ReturnType<typeof getImage>>;
  backgroundDesktop: Awaited<ReturnType<typeof getImage>>;
}

interface LayoutBackgroundFrame {
  mediaConfig: MediaConfig;
}

export async function loadLayoutBackgrounds({
  frame,
}: {
  frame: unknown;
}): Promise<LayoutBackgroundData> {
  const { mediaConfig } = frame as LayoutBackgroundFrame;

  const BACKGROUND_MOBILE_ASPECT_RATIO =
    backgroundMobileSource.width / backgroundMobileSource.height;
  const BACKGROUND_DESKTOP_ASPECT_RATIO =
    backgroundDesktopSource.width / backgroundDesktopSource.height;

  const mobileInferredWidth = inferCoverWidth(
    RESPONSIVE_VIEWPORT_WIDTHS.mobile,
    LAYOUT_MOBILE_HEIGHT,
    BACKGROUND_MOBILE_ASPECT_RATIO,
  );
  const desktopInferredWidth = inferCoverWidth(
    RESPONSIVE_VIEWPORT_WIDTHS.desktop,
    LAYOUT_DESKTOP_HEIGHT,
    BACKGROUND_DESKTOP_ASPECT_RATIO,
  );

  const backgroundQuality = mediaConfig.image.quality;
  const backgroundWidths = mediaConfig.image.widths.high;
  const backgroundDprScale = mediaConfig.image.dprScale.medium;

  const variants: BackgroundVariantInput[] = [
    {
      key: 'mobile',
      source: backgroundMobileSource,
      inferredWidth: mobileInferredWidth,
      aspectRatio: BACKGROUND_MOBILE_ASPECT_RATIO,
    },
    {
      key: 'desktop',
      source: backgroundDesktopSource,
      inferredWidth: desktopInferredWidth,
      aspectRatio: BACKGROUND_DESKTOP_ASPECT_RATIO,
    },
  ];

  const backgroundVariantEntries = await Promise.all(
    variants.map(async (variant) => {
      const width = selectCandidateWidthsByPolicy({
        candidateWidths: backgroundWidths,
        inferredWidths: [variant.inferredWidth],
        dprScale: backgroundDprScale,
        key: `${IMAGE_HIGH_WIDTHS_KEY}.${variant.key}.medium`,
        maxSelectableWidth: variant.source.width,
      })[0];

      const image = await getImage({
        src: variant.source,
        width,
        height: Math.ceil(width / variant.aspectRatio),
        fit: 'cover',
        position: 'center',
        format: 'webp',
        quality: backgroundQuality,
      });

      return [variant.key, image] as const;
    }),
  );

  const backgroundByVariant = Object.fromEntries(backgroundVariantEntries) as Record<
    BackgroundVariantKey,
    Awaited<ReturnType<typeof getImage>>
  >;

  return {
    backgroundMobile: backgroundByVariant.mobile,
    backgroundDesktop: backgroundByVariant.desktop,
  };
}

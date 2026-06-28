import type { LayoutProps } from '~/features/layout/types';
import type { ShellsConfig } from '~/features/site/types';

export type { LayoutProps };

const contentWidthTokens: Record<string, string> = {
  compact: 'var(--page-width-compact)',
  standard: 'var(--page-width-standard)',
  wide: 'var(--page-width-wide)',
};

/**
 * Resolves a content-width token to its CSS custom property value.
 * Unknown tokens are passed through as-is so callers can inject raw CSS
 * values without changing the shell contract.
 */
function resolveContentWidth(contentWidth: string): string {
  if (contentWidth in contentWidthTokens) {
    return contentWidthTokens[contentWidth];
  }

  return contentWidth;
}

const PAGE_OVERLAY = 'var(--page-overlay)';

const BASE_SHELL_TOKENS = {
  overlayAccentPrimary: 'var(--shell-hero-accent-primary)',
  overlayAccentSecondary: 'var(--shell-hero-accent-secondary)',
  surfaceBg: 'var(--shell-elevated-surface-bg)',
  cardSurfaceBg: 'var(--shell-elevated-card-bg)',
  surfaceBorder: 'var(--shell-elevated-surface-border)',
  pageCanvas: 'var(--shell-elevated-canvas)',
};

const SHELLS_CONFIG: ShellsConfig = {
  home: {
    ...BASE_SHELL_TOKENS,
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  about: {
    ...BASE_SHELL_TOKENS,
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  photography: {
    ...BASE_SHELL_TOKENS,
    textStrong: 'var(--shell-text-strong-photography)',
    textBody: 'var(--shell-text-body-photography)',
    textMuted: 'var(--shell-text-muted-photography)',
  },
};

/**
 * Builds the inline style string for a page shell by mapping semantic
 * shell tokens from config to CSS custom properties. Unknown pages fall
 * back to the base overlay and content-width tokens only.
 */
export function buildShellStyle(
  shell: string,
  contentWidth: string,
  shellsConfig?: ShellsConfig,
): string {
  const shellConfig = (shellsConfig ?? SHELLS_CONFIG)[shell as keyof ShellsConfig];
  const layoutContentWidth = resolveContentWidth(contentWidth);

  const shellStyleTokens: Record<string, string> = {
    '--page-overlay': PAGE_OVERLAY,
    '--layout-content-width': layoutContentWidth,
  };

  if (shellConfig) {
    Object.assign(shellStyleTokens, {
      '--page-overlay-accent-primary': shellConfig.overlayAccentPrimary,
      '--page-overlay-accent-secondary': shellConfig.overlayAccentSecondary,
      '--surface-bg': shellConfig.surfaceBg,
      '--card-surface-bg': shellConfig.cardSurfaceBg,
      '--surface-border': shellConfig.surfaceBorder,
      '--page-canvas': shellConfig.pageCanvas,
      '--text-strong': shellConfig.textStrong,
      '--text-body': shellConfig.textBody,
      '--text-muted': shellConfig.textMuted,
    });
  }

  return Object.entries(shellStyleTokens)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}
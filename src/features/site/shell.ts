import type { ShellsConfig } from '~/features/site/types';
import { assertString } from '~/core/validation/assert';

const contentWidthTokens: Record<string, string> = {
  compact: 'var(--page-width-compact)',
  standard: 'var(--page-width-standard)',
  wide: 'var(--page-width-wide)',
};

function resolveContentWidth(contentWidth: string): string {
  const key = assertString(contentWidth, 'contentWidth');
  const resolved = contentWidthTokens[key];
  if (!resolved) {
    throw new Error(`Unknown contentWidth token: "${key}". Expected one of: ${Object.keys(contentWidthTokens).join(', ')}.`);
  }
  return resolved;
}

const SHELLS_CONFIG: ShellsConfig = {
  home: {
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  about: {
    textStrong: 'var(--shell-home-text-strong)',
    textBody: 'var(--shell-home-text-body)',
    textMuted: 'var(--shell-home-text-muted)',
  },
  photography: {
    textStrong: 'var(--shell-text-strong-photography)',
    textBody: 'var(--shell-text-body-photography)',
    textMuted: 'var(--shell-text-muted-photography)',
  },
};

/**
 * Builds the inline style string for a page shell by mapping semantic
 * shell tokens from config to CSS custom properties. Unknown pages fall
 * back to the content-width token only. Static visual tokens (canvas,
 * surface, overlay accents) are consumed directly from source CSS tokens
 * in `layout-shell.css`; only per-shell text state and the dynamic
 * content width are emitted here.
 */
export function buildShellStyle(
  shell: string,
  contentWidth: string,
  shellsConfig?: ShellsConfig,
): string {
  const shellConfig = (shellsConfig ?? SHELLS_CONFIG)[shell as keyof ShellsConfig];
  const layoutContentWidth = resolveContentWidth(contentWidth);

  const shellStyleTokens: Record<string, string> = {
    '--layout-content-width': layoutContentWidth,
  };

  if (shellConfig) {
    Object.assign(shellStyleTokens, {
      '--text-strong': shellConfig.textStrong,
      '--text-body': shellConfig.textBody,
      '--text-muted': shellConfig.textMuted,
    });
  }

  return Object.entries(shellStyleTokens)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}
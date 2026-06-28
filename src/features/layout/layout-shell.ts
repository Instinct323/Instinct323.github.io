import { buildShellStyle } from '~/features/site/shell';
import type { LayoutBackgroundData } from './layout-background';

export interface LayoutShellData {
  shellStyle: string;
  shellBackgroundPayload: string;
}

export function buildLayoutShell(params: {
  shell: string;
  contentWidth: string;
  backgroundMobile: LayoutBackgroundData['backgroundMobile'];
  backgroundDesktop: LayoutBackgroundData['backgroundDesktop'];
}): LayoutShellData {
  const { shell, contentWidth, backgroundMobile, backgroundDesktop } = params;

  const shellStyle = buildShellStyle(shell, contentWidth);
  const shellBackgroundPayload = JSON.stringify({
    mobileSrc: backgroundMobile.src,
    desktopSrc: backgroundDesktop.src,
  });

  return {
    shellStyle,
    shellBackgroundPayload,
  };
}

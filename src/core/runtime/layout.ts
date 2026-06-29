import { parseDatasetPayload } from '~/core/utils/dataset';
import { hideCanvases, initStarfield } from '~/plugins/starfield/bootstrap';
import '~/plugins/starfield';

const SHELL_BACKGROUND_CACHE_KEY = 'site-shell-background-payload-v1';

export interface ShellBackgroundPayload {
  mobileSrc: string;
  desktopSrc: string;
}

function parseShellBackgroundPayload(): {
  payload: ShellBackgroundPayload;
  serializedPayload: string;
} | null {
  const siteFrame = document.querySelector<HTMLElement>('.site-frame[data-shell-background]');
  if (!siteFrame) {
    return null;
  }

  const serializedPayload = siteFrame.dataset.shellBackground;
  if (!serializedPayload) {
    throw new Error('Missing data-shell-background payload');
  }

  const payload = parseDatasetPayload(
    serializedPayload,
    (raw) => {
      const payload = raw as { mobileSrc?: string; desktopSrc?: string };
      if (!payload.mobileSrc || !payload.desktopSrc) {
        throw new Error('Invalid shell background payload');
      }
      return {
        mobileSrc: payload.mobileSrc,
        desktopSrc: payload.desktopSrc,
      };
    },
    'Invalid shell background payload',
  );

  return {
    payload,
    serializedPayload,
  };
}

function applyShellBackgroundImages(payload: ShellBackgroundPayload): void {
  document.body.style.setProperty('--page-bg-image-mobile', `url('${payload.mobileSrc}')`);
  document.body.style.setProperty('--page-bg-image-desktop', `url('${payload.desktopSrc}')`);
}

function readShellBackgroundCache(): ShellBackgroundPayload | null {
  let serializedPayload: string | null;
  try {
    serializedPayload = window.sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY);
  } catch {
    return null;
  }
  if (!serializedPayload) {
    return null;
  }
  return parseDatasetPayload(
    serializedPayload,
    (raw) => {
      const payload = raw as { mobileSrc?: string; desktopSrc?: string };
      if (!payload.mobileSrc || !payload.desktopSrc) {
        throw new Error('Invalid shell background cache payload');
      }
      return {
        mobileSrc: payload.mobileSrc,
        desktopSrc: payload.desktopSrc,
      };
    },
    'Invalid shell background cache payload',
  );
}

/**
 * Applies the shell background immediately and updates sessionStorage.
 * Background image URLs are already inlined server-side so this is
 * effectively a no-op for the visual state, but the cache write keeps
 * repeat navigations fast.
 */
function initShellBackground(): void {
  const cached = readShellBackgroundCache();
  if (cached) {
    applyShellBackgroundImages(cached);
    return;
  }

  const parsed = parseShellBackgroundPayload();
  if (!parsed) {
    return;
  }

  applyShellBackgroundImages(parsed.payload);

  try {
    window.sessionStorage.setItem(SHELL_BACKGROUND_CACHE_KEY, parsed.serializedPayload);
  } catch (e) {
    console.warn('SessionStorage unavailable:', e);
  }
}

function initializeStarfield(): void {
  const backgroundCanvas = document.querySelector<HTMLCanvasElement>('.site-stars-background');
  const starsCanvas = document.querySelector<HTMLCanvasElement>('.site-stars');

  if (!backgroundCanvas || !starsCanvas) {
    return;
  }

  try {
    const serializedConfig = starsCanvas.dataset.starfield;
    if (!serializedConfig) {
      throw new Error('Missing data-starfield payload');
    }
    const config = JSON.parse(serializedConfig);
    initStarfield(backgroundCanvas, starsCanvas, config);
  } catch (e) {
    console.error('Failed to initialize starfield:', e);
    hideCanvases(backgroundCanvas, starsCanvas);
    document.body.dataset.starfieldError = String(e);
  }
}

/**
 * Layout runtime entry point. Shell background images are cached in
 * sessionStorage so repeat navigations can apply them instantly without
 * waiting for the idle scheduler. The starfield effect is resolved
 * dynamically and scheduled via requestIdleCallback (or
 * requestAnimationFrame) so the layout runtime never eagerly loads the
 * effect bundle.
 */
export function initLayout(): void {
  initShellBackground();
  const schedule = 'requestIdleCallback' in window ? requestIdleCallback : requestAnimationFrame;
  schedule(() => initializeStarfield());
}
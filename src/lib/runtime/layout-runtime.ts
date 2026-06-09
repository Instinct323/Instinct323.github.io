import { getEffectsResolver } from '../domain/effects-resolver';
import { parseDatasetPayload } from '../utils/dataset';
import { runWhenIdle, SHELL_BACKGROUND_TIMEOUT, SHELL_BACKGROUND_FALLBACK } from './scheduling';
import '../../plugins/starfield';

const ENABLE_STARFIELD = true;

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

function applyShellBackgroundImagesWithCache(): void {
  try {
    const parsed = parseShellBackgroundPayload();
    if (!parsed) {
      return;
    }

    applyShellBackgroundImages(parsed.payload);

    try {
      window.sessionStorage.setItem(SHELL_BACKGROUND_CACHE_KEY, parsed.serializedPayload);
    // Silent: privacy mode or restricted contexts
    } catch {
    }
  } catch (e) {
    console.error('Failed to apply shell background images:', e);
  }
}

function applyShellBackgroundImagesFromSessionCache(): boolean {
  try {
    const parsed = parseShellBackgroundPayload();
    if (!parsed) {
      return true;
    }

    const cachedPayload = window.sessionStorage.getItem(SHELL_BACKGROUND_CACHE_KEY);
    if (cachedPayload !== parsed.serializedPayload) {
      return false;
    }

    applyShellBackgroundImages(parsed.payload);
    return true;
  // Silent: cache read failure
  } catch {
    return false;
  }
}

function scheduleShellBackgroundApply(): void {
  runWhenIdle(() => {
    applyShellBackgroundImagesWithCache();
  }, {
    timeout: SHELL_BACKGROUND_TIMEOUT,
    fallbackDelayMs: SHELL_BACKGROUND_FALLBACK,
  });
}

function initShellBackground(): void {
  if (!applyShellBackgroundImagesFromSessionCache()) {
    if (document.readyState === 'complete') {
      scheduleShellBackgroundApply();
    } else {
      window.addEventListener('load', scheduleShellBackgroundApply, { once: true });
    }
  }
}

function initializeStarfield(): void {
  if (ENABLE_STARFIELD) {
    const backgroundCanvas = document.querySelector<HTMLCanvasElement>('.site-stars-background');
    const starsCanvas = document.querySelector<HTMLCanvasElement>('.site-stars');

    if (backgroundCanvas && starsCanvas) {
      try {
        const serializedConfig = starsCanvas.dataset.starfield;
        if (!serializedConfig) {
          throw new Error('Missing data-starfield payload');
        }
        const config = JSON.parse(serializedConfig);
        const initStarfield = getEffectsResolver('starfield-runtime') as (
          _backgroundCanvas: HTMLCanvasElement,
          _starsCanvas: HTMLCanvasElement,
          _config: unknown
        ) => void;
        initStarfield(backgroundCanvas, starsCanvas, config);
      } catch (e) {
        console.error('Failed to initialize starfield:', e);
      }
    }
  }
}

export function initLayout(): void {
  initShellBackground();
  initializeStarfield();
}
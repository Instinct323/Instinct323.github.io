import { buildDeferredMountGroupSelector, initDeferredMounts } from './deferred-mount';
import { assertString } from '../utils/assertions';
import type { SiteImageConfig } from '../../types';
import { resolveDeferredMountRuntimeConfig } from '../domain/image-config';

export interface DeferredMountBootstrapOptions {
  containerSelector: string;
  configDataKey: string;
  mountGroup: string;
}

interface DeferredMountBootstrapConfig {
  rootMargin: string;
  mountDelayMs: number;
}

function parseBootstrapConfig(serializedConfig: string): DeferredMountBootstrapConfig {
  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(serializedConfig);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Invalid deferred mount bootstrap config: ${e.message}`);
    }
    throw e;
  }
  const config = rawConfig as Record<string, unknown>;
  const rootMargin = assertString(config?.rootMargin, 'deferred mount bootstrap rootMargin');

  if (typeof config?.mountDelayMs !== 'number' || config.mountDelayMs < 0) {
    throw new Error('Invalid deferred mount bootstrap mountDelayMs.');
  }

  return {
    rootMargin,
    mountDelayMs: config.mountDelayMs as number,
  };
}

export function bootstrapDeferredMounts(options: DeferredMountBootstrapOptions): void {
  const containerSelector = assertString(options.containerSelector, 'deferred mount bootstrap containerSelector');
  const configDataKey = assertString(options.configDataKey, 'deferred mount bootstrap configDataKey');
  const mountGroup = assertString(options.mountGroup, 'deferred mount bootstrap mountGroup');

  const container = document.querySelector(containerSelector);
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const serializedConfig = container.dataset[configDataKey];
  if (!serializedConfig) {
    throw new Error('Missing deferred mount runtime config payload.');
  }

  const runtimeConfig = parseBootstrapConfig(serializedConfig);
  initDeferredMounts({
    selector: buildDeferredMountGroupSelector(mountGroup),
    rootMargin: runtimeConfig.rootMargin,
    mountDelayMs: runtimeConfig.mountDelayMs,
  });
}

export function buildDeferredMountRuntimePayload(
  lazyLoad: SiteImageConfig['lazyLoad'],
  isDev: boolean,
): string {
  const runtimeConfig = resolveDeferredMountRuntimeConfig(lazyLoad, isDev);
  return JSON.stringify(runtimeConfig);
}

export function buildDeferredMountBootstrapOptions(
  containerSelector: string,
  configDataKey: string,
  mountGroup: string,
): DeferredMountBootstrapOptions {
  return {
    containerSelector,
    configDataKey,
    mountGroup,
  };
}

/**
 * Wraps deferred mount initialization in a try/catch so one failed group
 * does not crash the page or block other groups. Deferred mounts are
 * non-critical; graceful degradation keeps the rest of the page usable.
 */
export function initDeferredMountGroupSafely(
  options: DeferredMountBootstrapOptions,
  errorContext: string,
): void {
  try {
    bootstrapDeferredMounts(options);
  } catch (e) {
    console.error(`Failed to initialize ${errorContext} deferred loading:`, e);
  }
}

/**
 * Convenience wrapper that bootstraps deferred mounts for the home carousel
 * image group. Encapsulates the specific selector and config key pairing
 * so page-level code does not repeat them.
 */
export function initHomeCarouselDeferredMounts(): void {
  initDeferredMountGroupSafely(
    buildDeferredMountBootstrapOptions(
      '.home-carousel[data-carousel-lazy-config]',
      'carouselLazyConfig',
      'home-carousel-image',
    ),
    'home carousel',
  );
}
import { buildDeferredMountGroupSelector, initDeferredMounts } from './deferred-mount';
import { assertString } from '../utils/assertions';
import { parseDatasetPayload } from '../utils/dataset';
import type { DeferredImageLazyLoadConfig, DeferredMountRuntimeConfig } from '../../types/page-load';

/**
 * Derives the runtime deferred mount config from lazy-load settings.
 * In development we add an artificial delay so developers can observe
 * the loading behavior; in production we mount immediately for speed.
 */
export function resolveDeferredMountRuntimeConfig(
  lazyLoad: DeferredImageLazyLoadConfig,
  isDev: boolean,
): Omit<DeferredMountRuntimeConfig, 'selector'> {
  return {
    rootMargin: lazyLoad.rootMargin,
    mountDelayMs: isDev ? lazyLoad.localDebugDelayMs : 0,
  };
}

export interface DeferredMountBootstrapOptions {
  containerSelector: string;
  configDataKey: string;
  mountGroup: string;
}

type DeferredMountBootstrapConfig = Omit<DeferredMountRuntimeConfig, 'selector'>;

function parseBootstrapConfig(serializedConfig: string): DeferredMountBootstrapConfig {
  return parseDatasetPayload(
    serializedConfig,
    (rawConfig) => {
      const config = rawConfig as Record<string, unknown>;
      const rootMargin = assertString(config?.rootMargin, 'deferred mount bootstrap rootMargin');

      if (typeof config?.mountDelayMs !== 'number' || config.mountDelayMs < 0) {
        throw new Error('Invalid deferred mount bootstrap mountDelayMs.');
      }

      return {
        rootMargin,
        mountDelayMs: config.mountDelayMs as number,
      };
    },
    'Invalid deferred mount bootstrap config',
  );
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


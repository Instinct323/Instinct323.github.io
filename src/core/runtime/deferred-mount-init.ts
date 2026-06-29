import { buildDeferredMountGroupSelector, initDeferredMounts } from './deferred-mount';
import { assertFiniteNumber, assertString } from '~/core/validation/assert';
import { parseDatasetPayload } from '~/core/utils/dataset';
import type { DeferredMountRuntimeConfig } from '~/features/site/page-load';

export interface DeferredMountBootstrapOptions {
  containerSelector: string;
  configDataKey: string;
  mountGroup: string;
}

type DeferredMountBootstrapConfig = Omit<DeferredMountRuntimeConfig, 'selector'>;

/**
 * Parses the deferred-mount bootstrap config serialized in a DOM
 * dataset. Expects rootMargin (string) and mountDelayMs (number);
 * mountDelayMs is validated by assertFiniteNumber.
 */
function parseBootstrapConfig(serializedConfig: string): DeferredMountBootstrapConfig {
  return parseDatasetPayload(
    serializedConfig,
    (rawConfig) => {
      const config = rawConfig as Record<string, unknown>;
      const rootMargin = assertString(config?.rootMargin, 'deferred mount bootstrap rootMargin');

      return {
        rootMargin,
        mountDelayMs: assertFiniteNumber(config.mountDelayMs, 'deferred mount bootstrap mountDelayMs'),
      };
    },
    'Invalid deferred mount bootstrap config',
  );
}

/**
 * Boots a deferred mount group. Missing container → silent return
 * (the page may simply not use this group). Missing payload → throw
 * (the group is expected but its runtime config data is absent).
 */
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
 * Fail-soft wrapper for non-critical deferred mounts. One failed group
 * must not crash the page or block other groups.
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


import type { DeferredMountRuntimeConfig } from '~/features/site/page-load';

export const DEFERRED_MOUNT_DATA = {
  mount: 'data-deferred-mount',
  state: 'data-deferred-state',
  group: 'data-deferred-group',
  placeholder: 'data-deferred-placeholder',
  placeholderState: 'data-deferred-placeholder-state',
  placeholderText: 'data-deferred-placeholder-text',
  host: 'data-deferred-host',
  template: 'data-deferred-template',
} as const;

export const DEFERRED_MOUNT_STATE = {
  mounted: 'mounted',
  loaded: 'loaded',
  error: 'error',
} as const;

/** Builds a CSS selector for deferred-mount nodes belonging to a given group. */
export function buildDeferredMountGroupSelector(group: string): string {
  return `[${DEFERRED_MOUNT_DATA.group}="${group}"][${DEFERRED_MOUNT_DATA.mount}="true"]`;
}

function setPlaceholderMessage(
  node: HTMLElement,
  message: string,
  state: 'loading' | 'error',
): void {
  const placeholder = node.querySelector<HTMLElement>(`[${DEFERRED_MOUNT_DATA.placeholder}]`);
  if (!placeholder) {
    return;
  }

  placeholder.dataset.deferredPlaceholderState = state;
  const textNode = placeholder.querySelector<HTMLElement>(`[${DEFERRED_MOUNT_DATA.placeholderText}]`);
  if (textNode) {
    textNode.textContent = message;
  }
}

function mountDeferredNode(node: HTMLElement): void {
  if (node.dataset.deferredState === DEFERRED_MOUNT_STATE.loaded) {
    return;
  }

  const template = node.querySelector<HTMLTemplateElement>(`[${DEFERRED_MOUNT_DATA.template}]`);
  const host = node.querySelector<HTMLElement>(`[${DEFERRED_MOUNT_DATA.host}]`);

  if (!template || !host) {
    node.dataset.deferredState = DEFERRED_MOUNT_STATE.error;
    node.setAttribute('aria-busy', 'false');
    setPlaceholderMessage(node, 'Failed to load content.', 'error');
    return;
  }

  try {
    host.replaceChildren(template.content.cloneNode(true));
    template.remove();
    node.dataset.deferredState = DEFERRED_MOUNT_STATE.mounted;
    waitForMountedContent(node, host);
  } catch (error) {
    console.error('[deferred-mount]', error);
    node.dataset.deferredState = DEFERRED_MOUNT_STATE.error;
    setPlaceholderMessage(node, 'Failed to load content.', 'error');
    node.querySelector<HTMLElement>(`[${DEFERRED_MOUNT_DATA.placeholder}]`)?.remove();
  } finally {
    node.setAttribute('aria-busy', 'false');
  }
}

/**
 * Waits for images inside freshly mounted content to finish loading before
 * removing the placeholder. Removing the placeholder early would cause layout
 * shift and a flash of unstyled content.
 */
function waitForMountedContent(node: HTMLElement, host: HTMLElement): void {
  const mountedImages = Array.from(host.querySelectorAll<HTMLImageElement>('img'));

  if (mountedImages.length === 0) {
    node.dataset.deferredState = DEFERRED_MOUNT_STATE.loaded;
    return;
  }

  const pendingImages = mountedImages.filter((image) => !image.complete);
  if (pendingImages.length === 0) {
    node.dataset.deferredState = DEFERRED_MOUNT_STATE.loaded;
    return;
  }

  let remainingImages = pendingImages.length;

  // Counts down as each image fires load or error; placeholder fade-out is gated
  // on ALL images settling so the layout does not shift while images are still loading.
  const markImageReady = (): void => {
    remainingImages -= 1;
    if (remainingImages > 0) {
      return;
    }

    node.dataset.deferredState = DEFERRED_MOUNT_STATE.loaded;
  };

  // Treat both load and error as "settled" — a broken image should not block placeholder fade-out forever.
  pendingImages.forEach((image) => {
    image.addEventListener('load', markImageReady, { once: true });
    image.addEventListener('error', markImageReady, { once: true });
  });
}

/**
 * Mounts a deferred node immediately or after a configurable delay.
 * The debug delay lets developers visually verify deferred mount behavior
 * during development without changing production logic.
 */
function mountWithDelay(node: HTMLElement, mountDelayMs: number): void {
  if (mountDelayMs <= 0) {
    mountDeferredNode(node);
    return;
  }

  window.setTimeout(() => {
    mountDeferredNode(node);
  }, mountDelayMs);
}

/**
 * Sets up intersection-based lazy mounting for deferred content nodes.
 * Heavy DOM subtrees are deferred until they enter the viewport so initial
 * page load stays fast and lightweight.
 *
 * @throws When `rootMargin` is syntactically invalid for `IntersectionObserver`.
 */
export function initDeferredMounts(config: DeferredMountRuntimeConfig): void {
  const { selector, rootMargin, mountDelayMs } = config;

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (nodes.length === 0) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    nodes.forEach((node) => {
      mountWithDelay(node, mountDelayMs);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const node = entry.target as HTMLElement;
        mountWithDelay(node, mountDelayMs);
        observer.unobserve(node);
      }
    },
    {
      root: null,
      rootMargin,
    },
  );

  nodes.forEach((node) => {
    observer.observe(node);
  });
}
/** Must match the iframe class in PublicationsSection.astro. */
const VIDEO_IFRAME_SELECTOR = '.publication-video-iframe';

interface ToggleOptions {
  selector: string;
  showLabel: string;
  hideLabel: string;
  onExpand?: (_panel: HTMLElement, _toggle: Element) => void;
  onCollapse?: (_panel: HTMLElement, _toggle: Element) => void;
}

/**
 * Provides show/hide toggle behavior for publication panels.
 * Skips elements already initialized to avoid duplicate listeners in HMR scenarios.
 */
function initToggles(options: ToggleOptions): void {
  const toggles = document.querySelectorAll(options.selector);

  toggles.forEach((toggle) => {
    if (toggle.hasAttribute('data-toggle-initialized')) {
      return;
    }
    toggle.setAttribute('data-toggle-initialized', '');

    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      if (!targetId) {
        if (import.meta.env?.DEV) {
          console.warn('[initToggles] missing data-target on toggle element:', toggle);
        }
        return;
      }

      const panel = document.getElementById(targetId);
      if (!panel) {
        if (import.meta.env?.DEV) {
          console.warn(`[initToggles] panel not found for targetId: ${targetId}`);
        }
        return;
      }

      const isCollapsed = panel.hasAttribute('hidden');
      if (isCollapsed) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = options.hideLabel;
        options.onExpand?.(panel, toggle);
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = options.showLabel;
        options.onCollapse?.(panel, toggle);
      }
    });
  });
}

/**
 * Wires up click handlers for publication abstract expand/collapse toggles.
 * Expects toggle buttons with `data-abstract-toggle` and `data-target` attributes
 * pointing to panels containing the abstract text.
 *
 * NOTE: We intentionally avoid `<details>` here because its implicit container
 * layer breaks flex alignment with sibling buttons in the publication links row.
 */
export function initPublicationAbstractToggles(): void {
  initToggles({
    selector: '[data-abstract-toggle]',
    showLabel: 'Abstract',
    hideLabel: 'Hide Abstract',
  });
}

/**
 * Wires up click handlers for publication video expand/collapse toggles.
 * Expects toggle buttons with `data-video-toggle` and `data-target` attributes
 * pointing to panels containing an iframe.
 *
 * Lazy-loads the iframe `src` from `data-embed` on expand and clears the
 * `src` attribute on collapse to stop playback.
 */
export function initPublicationVideoToggles(): void {
  initToggles({
    selector: '[data-video-toggle]',
    showLabel: 'Video',
    hideLabel: 'Hide Video',
    onExpand(panel, toggle) {
      const iframe = panel.querySelector(VIDEO_IFRAME_SELECTOR);
      if (!iframe) {
        console.warn('[initPublicationVideoToggles] iframe not found in panel:', panel);
        return;
      }
      const embedUrl = toggle.getAttribute('data-embed');
      if (embedUrl) {
        iframe.setAttribute('src', embedUrl);
      }
    },
    onCollapse(panel) {
      const iframe = panel.querySelector(VIDEO_IFRAME_SELECTOR);
      if (iframe) {
        iframe.removeAttribute('src');
      }
    },
  });
}

export function initPublicationToggles(): void {
  initPublicationAbstractToggles();
  initPublicationVideoToggles();
}

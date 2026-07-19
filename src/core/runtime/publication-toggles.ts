/**
 * Generic panel-toggle controller for publication cards.
 *
 * Any button with `data-panel-toggle` and `data-target` becomes a toggle.
 * Optional `data-show-label` / `data-hide-label` control button text.
 * Optional `data-embed` on the toggle lazy-loads an iframe src inside the panel.
 *
 * Only one panel per `.publication-item` may be expanded at a time.
 */

function setPanelState(toggle: Element, panel: HTMLElement, expanded: boolean): void {
  if (expanded) {
    panel.removeAttribute('hidden');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = toggle.getAttribute('data-hide-label') ?? toggle.textContent;
    const embedUrl = toggle.getAttribute('data-embed');
    if (embedUrl) panel.querySelector('iframe')?.setAttribute('src', embedUrl);
  } else {
    panel.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = toggle.getAttribute('data-show-label') ?? toggle.textContent;
    panel.querySelector('iframe')?.removeAttribute('src');
  }
}

/** Initializes all panel toggles, enforcing one-open-per-item. */
export function initPublicationPanelToggles(): void {
  document.querySelectorAll('[data-panel-toggle]').forEach((toggle) => {
    if (toggle.hasAttribute('data-toggle-initialized')) return;
    toggle.setAttribute('data-toggle-initialized', '');

    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      if (!targetId) {
        if (import.meta.env?.DEV) {
          console.warn('[initPublicationPanelToggles] missing data-target on toggle element:', toggle);
        }
        return;
      }

      const panel = document.getElementById(targetId);
      if (!panel) {
        if (import.meta.env?.DEV) {
          console.warn(`[initPublicationPanelToggles] panel not found for targetId: ${targetId}`);
        }
        return;
      }

      const expand = panel.hasAttribute('hidden');
      if (expand) {
        toggle.closest('.publication-item')
          ?.querySelectorAll('[aria-expanded="true"]')
          .forEach((other) => {
            if (other === toggle) return;
            const otherPanel = document.getElementById(other.getAttribute('data-target') ?? '');
            if (otherPanel) setPanelState(other, otherPanel, false);
          });
      }

      setPanelState(toggle, panel, expand);
    });
  });
}



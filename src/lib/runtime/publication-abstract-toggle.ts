/**
 * Wires up click handlers for publication abstract expand/collapse toggles.
 * Expects toggle buttons with `data-abstract-toggle` and `data-target` attributes
 * pointing to panels controlled via the `hidden` attribute and `aria-expanded` state.
 */
export function initPublicationAbstractToggles(): void {
  const abstractToggles = document.querySelectorAll('[data-abstract-toggle]');

  abstractToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      if (!targetId) {
        return;
      }

      const panel = document.getElementById(targetId);
      if (!panel) {
        return;
      }

      const isCollapsed = panel.hasAttribute('hidden');
      if (isCollapsed) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = 'Hide abstract';
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Abstract';
      }
    });
  });
}

import type { NavigationConfig, SiteNavRoute } from '~/features/site/types';
import { wordsToTitle } from '~/core/content/normalize';

export interface SiteNavItem extends SiteNavRoute {
  label: string;
  testId: string;
}

export interface SiteNavModel {
  ariaLabel: string;
  items: SiteNavItem[];
}

export function formatPageLabel(key: string): string {
  return wordsToTitle([key]);
}

function buildNavItems(navigation: NavigationConfig): SiteNavItem[] {
  return navigation.order.map((key) => {
    const route = navigation.routes[key];
    if (!route) {
      throw new Error(`buildNavItems: key "${key}" not found in navigation.routes`);
    }
    return {
      key: route.key,
      href: route.href,
      testId: 'nav-' + route.key,
      label: formatPageLabel(route.key),
    };
  });
}

/** Builds the primary navigation model from the configured route order. */
export function buildPrimaryNavModel(navigation: NavigationConfig): SiteNavModel {
  return {
    ariaLabel: 'Primary navigation',
    items: buildNavItems(navigation),
  };
}

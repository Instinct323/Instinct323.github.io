import type { NavigationConfig } from '../../types';

export interface SiteNavRoute {
  key: string;
  href: string;
  navTestId: string;
}

export interface SiteNavItem extends SiteNavRoute {
  label: string;
}

export interface SiteNavModel {
  ariaLabel: string;
  items: SiteNavItem[];
}

const NAV_ROUTES: Record<string, SiteNavRoute> = {
  home: {
    key: 'home',
    href: '/',
    navTestId: 'nav-home',
  },
  about: {
    key: 'about',
    href: '/about',
    navTestId: 'nav-about',
  },
  photography: {
    key: 'photography',
    href: '/photography',
    navTestId: 'nav-photography',
  },
  blog: {
    key: 'blog',
    href: '/blog',
    navTestId: 'nav-blog',
  },
};


export function formatPageLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function buildNavItems(routeKeys: string[]): SiteNavItem[] {
  return routeKeys.map((key) => {
    const route = NAV_ROUTES[key];
    if (!route) {
      throw new Error(`buildNavItems: key "${key}" not found in NAV_ROUTES`);
    }
    return {
      key,
      href: route.href,
      navTestId: route.navTestId,
      label: formatPageLabel(key),
    };
  });
}

export function buildPrimaryNavModel(navigation: NavigationConfig): SiteNavModel {
  return {
    ariaLabel: 'Primary navigation',
    items: buildNavItems(navigation.order),
  };
}

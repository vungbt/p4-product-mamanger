import type { IconName, SidebarEntry, SidebarProps } from '@itclabs/react-ui';
import { useAbility } from '@p4/ability/browser';
import { canAccess } from '@p4/ability/shared';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';
import RouteConfigs from '@/routing/config.route';
import { getPortalMenuRoutes, type IRoute } from '@/routing/route.types';

export type AdminPageLink = {
  id: string;
  label: string;
  href: string;
  icon?: IconName;
  section?: string;
};

/** Admin menu entries the current user can open, in sidebar order. */
export function useAdminMenu(): SidebarEntry[] {
  const { t } = useTranslation();
  const ability = useAbility();

  const toItems = (routes: IRoute[]): SidebarEntry[] =>
    routes
      .filter(
        (route) =>
          !route.hideInMenu &&
          (!route.ability || canAccess(ability, route.ability.action, route.ability.subject)),
      )
      .map<SidebarEntry>((route) => {
        const base = {
          id: route.name,
          label: t(`menu.${route.name}`, { defaultValue: route.label ?? route.name }),
          icon: route.iconName,
          exact: route.exact,
        };

        if (route.existSubMenu && route.routes?.length) {
          return { ...base, type: 'submenu', items: toItems(route.routes) };
        }

        return { ...base, href: route.path };
      })
      .filter((item) => !(item.type === 'submenu' && !item.items.length));

  return toItems(getPortalMenuRoutes(RouteConfigs, 'admin-portal'));
}

/** Flatten menu entries into the pages the search dialog can open. */
export function toPageLinks(entries: readonly SidebarEntry[], section?: string): AdminPageLink[] {
  return entries.flatMap((entry): AdminPageLink[] => {
    if (entry.type === 'submenu') return toPageLinks(entry.items, String(entry.label));
    if (entry.type === 'group') return toPageLinks(entry.items, section);
    if (!('href' in entry) || !entry.href) return [];

    return [
      {
        id: entry.id,
        label: String(entry.label),
        href: entry.href,
        icon: typeof entry.icon === 'string' ? entry.icon : undefined,
        section,
      },
    ];
  });
}

/** Sidebar configuration for the admin DashboardShell: brand, page search (mod+k) and menu. */
export function useAdminSidebar(menu: SidebarEntry[], onSearch: () => void): SidebarProps {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return {
    'data-testid': 'admin-sidebar',
    appearance: 'default',
    collapseToggle: 'none',
    toggleShortcut: 'mod+b',
    header: {
      logo: <BrandLogo variant="mark-white" height={20} />,
      title: t('app.admin'),
      subtitle: t('app.adminSubtitle'),
      href: ROUTES.admin.dashboard,
    },
    search: {
      placeholder: t('adminSearch.trigger'),
      shortcut: 'mod+k',
      onOpen: onSearch,
    },
    items: [{ id: 'main', type: 'group', label: t('common.navigation'), items: menu }],
    currentPath: pathname,
    navigationLabel: t('app.admin'),
  };
}

import type { SidebarEntry, SidebarProps } from '@itclabs/react-ui';
import { useAbility } from '@p4/ability/browser';
import { canAccess } from '@p4/ability/shared';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import RouteConfigs from '@/routing/config.route';
import { getPortalMenuRoutes, type IRoute } from '@/routing/route.types';
/** Sidebar configuration for the admin DashboardShell; the topbar carries the brand and account. */
export function useAdminSidebar(): SidebarProps {
  const { t } = useTranslation();
  const { pathname } = useLocation();
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
          const items = toItems(route.routes);
          return { ...base, type: 'submenu', items };
        }
        return { ...base, href: route.path };
      })
      .filter((item) => !(item.type === 'submenu' && !item.items.length));
  return {
    'data-testid': 'admin-sidebar',
    collapseToggle: 'none',
    items: [
      {
        id: 'main',
        type: 'group',
        label: t('common.navigation'),
        items: toItems(getPortalMenuRoutes(RouteConfigs, 'admin-portal')),
      },
    ],
    currentPath: pathname,
    navigationLabel: t('app.admin'),
  };
}

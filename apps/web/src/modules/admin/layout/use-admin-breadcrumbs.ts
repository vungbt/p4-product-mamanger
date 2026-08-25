import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import RouteConfigs from '@/routing/config.route';
import { getPortalMenuRoutes } from '@/routing/route.types';

export type AdminBreadcrumb = { key: string; label: string };

/**
 * Computes the "Admin › [Group] › Current page" breadcrumb from the current route, matching
 * the `admin-portal` structure in `RouteConfigs` (a route with `existSubMenu` adds a middle
 * level, a flat route skips it). Extracted into its own hook so `AdminHeaderBar` only has to
 * worry about rendering, and so this logic can be tested/reused independently later if needed
 * (e.g. a page title, a condensed mobile breadcrumb) without dragging along the header component.
 */
export default function useAdminBreadcrumbs(): AdminBreadcrumb[] {
  const { t } = useTranslation();
  const location = useLocation();

  return useMemo(() => {
    const portal = getPortalMenuRoutes(RouteConfigs, 'admin-portal');
    const flat: Array<{
      path: string;
      name: string;
      label?: string;
      parentName?: string;
      parentLabel?: string;
    }> = [];

    for (const route of portal) {
      if (route.existSubMenu && route.routes?.length) {
        for (const child of route.routes) {
          flat.push({ ...child, parentName: route.name, parentLabel: route.label });
        }
      } else {
        flat.push(route);
      }
    }

    const match = flat
      .filter((r) => {
        if (r.path.includes(':')) {
          const pattern = new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`);
          return pattern.test(location.pathname);
        }
        return location.pathname === r.path || location.pathname.startsWith(`${r.path}/`);
      })
      .sort((a, b) => b.path.length - a.path.length)[0];

    const crumbs: AdminBreadcrumb[] = [{ key: 'root', label: t('app.admin') }];

    if (match?.parentName) {
      crumbs.push({
        key: match.parentName,
        label: t(`menu.${match.parentName}`, {
          defaultValue: match.parentLabel ?? match.parentName,
        }),
      });
    }

    crumbs.push({
      key: match?.name ?? 'admin-dashboard',
      label: match
        ? t(`menu.${match.name}`, { defaultValue: match.label ?? match.name })
        : t('menu.admin-dashboard'),
    });

    return crumbs;
  }, [location.pathname, t]);
}

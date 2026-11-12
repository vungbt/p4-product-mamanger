import { Sidebar, type SidebarEntry } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { BRAND } from '@/brand';
import { usePendingRequestCount } from '@/libraries/use-pending-requests';
import { ROUTES } from '@/routing/route-configs';
import { useMenuRoutes } from '@/routing/use-routes';

/**
 * Menu groups in monthly work order. The kit spaces top-level entries apart (gap-5) and items of
 * a group tightly, so routes belong to a group; routes not listed here (Tổng quan) stay on top.
 */
const MENU_GROUPS = [
  { id: 'monthly', routes: ['readings', 'invoices', 'payments', 'receivables', 'requests'] },
  { id: 'rental', routes: ['rooms', 'contracts', 'deposits', 'tenants', 'residents'] },
  { id: 'management', routes: ['maintenance', 'expenses', 'reports', 'audit', 'settings'] },
] as const;

/** Desktop navigation (lg and up); mobile uses `BottomNav`. */
export default function AppSidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const routes = useMenuRoutes();
  const pending = usePendingRequestCount();

  const entry = (route: (typeof routes)[number]): SidebarEntry => ({
    id: route.name,
    label: route.label ?? t(`nav.${route.name}`),
    icon: route.icon,
    href: route.path,
    exact: route.exact,
    // New tenant requests of the active building (O-26).
    ...(route.name === 'requests' && pending > 0 ? { badge: pending } : {}),
  });
  const byName = new Map(routes.map((route) => [route.name, route]));
  const grouped = new Set<string>(MENU_GROUPS.flatMap((group) => group.routes));
  const items: SidebarEntry[] = [
    ...routes.filter((route) => !grouped.has(route.name)).map(entry),
    ...MENU_GROUPS.flatMap((group) => {
      const groupItems = group.routes.flatMap((name) => {
        const route = byName.get(name);
        return route ? [entry(route)] : [];
      });

      return groupItems.length
        ? [
            {
              type: 'group' as const,
              id: group.id,
              label: t(`nav.group.${group.id}`),
              items: groupItems,
            },
          ]
        : [];
    }),
  ];

  return (
    <Sidebar
      data-testid="app-sidebar"
      collapseToggle="none"
      itemVariant="indicator"
      groupLabel="caps"
      groupDividers
      header={{
        // The kit draws the rounded accent square; the logo (with its own background) fills it.
        logo: <img src={BRAND.logo} alt="" className="size-full" draggable={false} />,
        title: BRAND.name,
        subtitle: t('app.tagline'),
        href: ROUTES.overview,
      }}
      items={items}
      currentPath={pathname}
      navigationLabel={t('nav.main')}
    />
  );
}

import { Sidebar, type SidebarEntry } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { BRAND } from '@/brand';
import { usePendingRequestCount } from '@/libraries/use-pending-requests';
import { ROUTES } from '@/routing/route-configs';
import { useMenuRoutes } from '@/routing/use-routes';

/** Desktop navigation (lg and up); mobile uses `BottomNav`. */
export default function AppSidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const routes = useMenuRoutes();
  const pending = usePendingRequestCount();

  const items: SidebarEntry[] = routes.map((route) => ({
    id: route.name,
    label: t(`nav.${route.name}`),
    icon: route.icon,
    href: route.path,
    exact: route.exact,
    // New tenant requests of the active building (O-26).
    ...(route.name === 'requests' && pending > 0 ? { badge: pending } : {}),
  }));

  return (
    <Sidebar
      data-testid="app-sidebar"
      itemVariant="bar"
      // Kit 0.13.0 spaces nav children with gap-5 (meant between groups); a flat list needs the
      // in-group item spacing. Drop this once the menu uses groups or the kit fixes it.
      classNames={{ nav: 'gap-1' }}
      header={{
        // The kit draws the rounded accent square; the mark letter goes inside.
        logo: (
          <span aria-hidden className="text-control font-bold">
            {BRAND.mark}
          </span>
        ),
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

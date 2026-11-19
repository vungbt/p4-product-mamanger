import { Breadcrumb, IconButton } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND, BrandMark } from '@/brand';
import { useCanAccessSome } from '@/libraries/ability';
import { BuildingSelector } from '@/libraries/buildings/building-selector';
import { useNavigationLabels } from '@/libraries/navigation-labels';
import { usePageDescription } from '@/libraries/page-meta';
import { appRoutes, ROUTES } from '@/routing/route-configs';
import { routeTrail, useCurrentRoute } from '@/routing/use-routes';
import AccountMenu from './account-menu';
import NotificationsBell from './notifications-bell';

function hasHistory() {
  const state: unknown = window.history.state;

  return Boolean(state && typeof state === 'object' && 'idx' in state && Number(state.idx) > 0);
}

/** Full-width bar. Desktop: brand. Mobile: back button and screen title. Both: building + account. */
export function AppTopbar() {
  const { t } = useTranslation();

  const routeLabels = useNavigationLabels();

  const navigate = useNavigate();
  // Notifications are per building (API: read Building); tenants have none.

  const canReadNotifications = useCanAccessSome('read', 'Building');

  const route = useCurrentRoute();

  const parent = route?.parent ? appRoutes.find(({ name }) => name === route.parent) : undefined;

  const title = route ? (routeLabels[route.name] ?? route.name) : '';
  const isHome = route?.path === ROUTES.overview;

  const goBack = () => {
    if (hasHistory()) navigate(-1);
    else navigate(parent?.path ?? ROUTES.overview);
  };

  return (
    <>
      <Link
        to={ROUTES.overview}
        className="hidden shrink-0 items-center gap-2 font-semibold text-ink lg:flex"
      >
        <BrandMark className="size-8" />
        {BRAND.name}
      </Link>
      <div className="flex min-w-0 items-center gap-1 lg:hidden">
        {isHome ? (
          <BrandMark className="size-7" />
        ) : (
          <IconButton icon="arrowLeft" variant="ghost" label={t('header.back')} onClick={goBack} />
        )}
        <span className="truncate text-section font-semibold text-ink" data-testid="mobile-title">
          {title || BRAND.name}
        </span>
      </div>
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <BuildingSelector />
        {canReadNotifications ? <NotificationsBell /> : null}
        <AccountMenu />
      </div>
    </>
  );
}

/** Page header on desktop: where the user is and what the screen is for. */
export function AppBreadcrumb() {
  const { t } = useTranslation();

  const routeLabels = useNavigationLabels();

  const route = useCurrentRoute();

  const description = usePageDescription();

  const title = route ? (routeLabels[route.name] ?? route.name) : '';
  const isHome = route?.path === ROUTES.overview;

  return (
    <div className="grid min-w-0 gap-0.5">
      <Breadcrumb
        className="min-w-0"
        items={
          route && !isHome
            ? [
                { key: 'overview', title: t('nav.overview'), href: ROUTES.overview },
                ...routeTrail(route).map((item) =>
                  item === route
                    ? { key: item.name, title }
                    : {
                        key: item.name,
                        title: routeLabels[item.name] ?? item.name,
                        href: item.path,
                      },
                ),
              ]
            : [{ key: 'overview', title: t('nav.overview') }]
        }
      />
      {description ? (
        <p className="truncate text-ui-sm text-muted" data-testid="page-description">
          {description}
        </p>
      ) : null}
    </div>
  );
}

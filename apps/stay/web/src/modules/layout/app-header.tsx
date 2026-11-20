import { Breadcrumb, IconButton } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND, BrandMark } from '@/brand';
import { useCanAccessSome } from '@/libraries/ability';
import { BuildingSelector } from '@/libraries/buildings/building-selector';
import { useNavigationLabels } from '@/libraries/navigation-labels';
import { usePageDescription } from '@/libraries/page-meta';
import { useAuth } from '@/libraries/session/auth-provider';
import { TenantContractSelector } from '@/modules/portal/account-contract-selector';
import { ROUTES } from '@/routing/route-configs';
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

  const { user } = useAuth();

  const routeLabels = useNavigationLabels();

  const navigate = useNavigate();
  // Notifications are per building (API: read Building); tenants have none.

  const canReadNotifications = useCanAccessSome('read', 'Building');

  const route = useCurrentRoute();

  const home = user?.role === 'tenant' ? '/my' : ROUTES.overview;
  const parent = route ? routeTrail(route).at(-2) : undefined;

  const title = route ? (route.label ?? routeLabels[route.name] ?? route.name) : '';
  const isHome = route?.path === home;

  const goBack = () => {
    if (hasHistory()) navigate(-1);
    else navigate(parent?.path ?? home);
  };

  return (
    <>
      <Link to={home} className="hidden shrink-0 items-center gap-2 font-semibold text-ink lg:flex">
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
        {user?.role === 'tenant' ? <TenantContractSelector /> : <BuildingSelector />}
        {canReadNotifications ? <NotificationsBell /> : null}
        <AccountMenu />
      </div>
    </>
  );
}

/** Page header on desktop: where the user is and what the screen is for. */
export function AppBreadcrumb() {
  const { t } = useTranslation();

  const { user } = useAuth();

  const routeLabels = useNavigationLabels();

  const route = useCurrentRoute();

  const description = usePageDescription();

  const home = user?.role === 'tenant' ? '/my' : ROUTES.overview;

  const title = route ? (route.label ?? routeLabels[route.name] ?? route.name) : '';
  const isHome = route?.path === home;

  return (
    <div className="grid min-w-0 gap-0.5">
      <Breadcrumb
        className="min-w-0"
        items={
          route && !isHome
            ? [
                { key: 'overview', title: t('nav.overview'), href: home },
                ...routeTrail(route).map((item) =>
                  item === route
                    ? { key: item.name, title }
                    : {
                        key: item.name,
                        title: item.label ?? routeLabels[item.name] ?? item.name,
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

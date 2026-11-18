import { Breadcrumb, IconButton, WorkspaceHeader } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BRAND, BrandMark } from '@/brand';
import { useCanAccessSome } from '@/libraries/ability';
import { BuildingSelector } from '@/libraries/buildings/building-selector';
import { usePageDescription } from '@/libraries/page-meta';
import { appRoutes, ROUTES } from '@/routing/route-configs';
import { routeTrail, useCurrentRoute } from '@/routing/use-routes';
import AccountMenu from './account-menu';
import NotificationsBell from './notifications-bell';

function hasHistory() {
  const state: unknown = window.history.state;

  return Boolean(state && typeof state === 'object' && 'idx' in state && Number(state.idx) > 0);
}

/** Desktop: breadcrumb. Mobile: back button and screen title. Both: building + account. */
export default function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Notifications are per building (API: read Building); tenants have none.
  const canReadNotifications = useCanAccessSome('read', 'Building');
  const route = useCurrentRoute();
  const description = usePageDescription();

  const parent = route?.parent ? appRoutes.find(({ name }) => name === route.parent) : undefined;

  const title = route ? t(`nav.${route.name}`) : '';
  const isHome = route?.path === ROUTES.overview;

  const goBack = () => {
    if (hasHistory()) navigate(-1);
    else navigate(parent?.path ?? ROUTES.overview);
  };

  return (
    <WorkspaceHeader
      sidebarToggle
      className="sticky top-0 z-30 flex-nowrap gap-2 bg-surface px-3 sm:px-5"
      actionsClassName="ml-auto flex-nowrap"
      breadcrumb={
        <>
          <div className="flex min-w-0 items-center gap-1 lg:hidden">
            {isHome ? (
              <BrandMark className="size-7" />
            ) : (
              <IconButton
                icon="arrowLeft"
                variant="ghost"
                label={t('header.back')}
                onClick={goBack}
              />
            )}
            <span
              className="truncate text-section font-semibold text-ink"
              data-testid="mobile-title"
            >
              {title || BRAND.name}
            </span>
          </div>
          <div className="hidden min-w-0 lg:grid lg:gap-0.5">
            <Breadcrumb
              className="min-w-0"
              items={
                route && !isHome
                  ? [
                      { key: 'overview', title: t('nav.overview'), href: ROUTES.overview },
                      ...routeTrail(route).map((item) =>
                        item === route
                          ? { key: item.name, title }
                          : { key: item.name, title: t(`nav.${item.name}`), href: item.path },
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
        </>
      }
      actions={
        <>
          <BuildingSelector />
          {canReadNotifications ? <NotificationsBell /> : null}
          <AccountMenu />
        </>
      }
    />
  );
}

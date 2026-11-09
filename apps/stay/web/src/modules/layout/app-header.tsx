import { Breadcrumb, IconButton, WorkspaceHeader } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BRAND, BrandMark } from '@/brand';
import { useCanAccess } from '@/libraries/ability';
import { BuildingSelector } from '@/libraries/buildings/building-selector';
import { ROUTES } from '@/routing/route-configs';
import { useCurrentRoute } from '@/routing/use-routes';
import AccountMenu from './account-menu';

function hasHistory() {
  const state: unknown = window.history.state;

  return Boolean(state && typeof state === 'object' && 'idx' in state && Number(state.idx) > 0);
}

/** Desktop: breadcrumb. Mobile: back button and screen title. Both: building + account. */
export default function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const route = useCurrentRoute();
  const canSeeRequests = useCanAccess('manage', 'Maintenance');

  const title = route ? t(`nav.${route.name}`) : '';
  const isHome = route?.path === ROUTES.overview;

  const goBack = () => {
    if (hasHistory()) navigate(-1);
    else navigate(ROUTES.overview);
  };

  return (
    <WorkspaceHeader
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
          <Breadcrumb
            className="hidden min-w-0 lg:block"
            items={
              route && !isHome
                ? [
                    { key: 'overview', title: t('nav.overview'), href: ROUTES.overview },
                    { key: route.name, title },
                  ]
                : [{ key: 'overview', title: t('nav.overview') }]
            }
          />
        </>
      }
      actions={
        <>
          <BuildingSelector />
          {canSeeRequests ? (
            <IconButton
              icon="bell"
              variant="ghost"
              label={t('header.requests')}
              onClick={() => toast.info(t('header.requestsSoon'))}
            />
          ) : null}
          <AccountMenu />
        </>
      }
    />
  );
}

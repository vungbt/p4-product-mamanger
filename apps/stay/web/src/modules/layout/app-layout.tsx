import { EmptyState, SidebarProvider } from '@itclabs/react-ui';
import { DashboardShell } from '@itclabs/react-ui/templates';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { BuildingProvider } from '@/libraries/buildings/building-provider';
import { PageMetaProvider } from '@/libraries/page-meta';
import { useAuth } from '@/libraries/session/auth-provider';
import { AppBreadcrumb, AppTopbar } from './app-header';
import { useAppSidebar } from './app-sidebar';
import BottomNav from './bottom-nav';

const MAIN_ID = 'main-content';

function AppShell() {
  const sidebar = useAppSidebar();

  const { user } = useAuth();

  const { pathname } = useLocation();

  return (
    <DashboardShell
      variant="floating"
      className="w-full max-w-none"
      classNames={{ header: 'max-lg:hidden lg:px-10' }}
      sidebarToggle
      topbar={<AppTopbar />}
      sidebar={sidebar}
      header={<AppBreadcrumb />}
    >
      <div id={MAIN_ID} tabIndex={-1} className="pb-bottom-nav outline-none lg:pb-0">
        {user?.role === 'tenant' && user.contractIds.length === 0 && pathname !== '/my/account' ? (
          <EmptyState
            title="Chưa có hợp đồng"
            description="Liên hệ chủ trọ để được thêm vào hợp đồng."
          />
        ) : (
          <Outlet />
        )}
      </div>
    </DashboardShell>
  );
}

/** C-02 shell: floating sidebar on desktop (lg+), bottom navigation on mobile. */
export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <BuildingProvider>
      <SidebarProvider>
        <a
          href={`#${MAIN_ID}`}
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-floating"
        >
          {t('app.skipToContent')}
        </a>
        <PageMetaProvider>
          <AppShell />
        </PageMetaProvider>
        <BottomNav />
      </SidebarProvider>
    </BuildingProvider>
  );
}

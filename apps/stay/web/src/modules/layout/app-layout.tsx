import { SidebarProvider, WorkspaceBody, WorkspaceMain, WorkspaceShell } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { BuildingProvider } from '@/libraries/buildings/building-provider';
import { PageMetaProvider } from '@/libraries/page-meta';
import AppHeader from './app-header';
import AppSidebar from './app-sidebar';
import BottomNav from './bottom-nav';

const MAIN_ID = 'main-content';

/** C-02 shell: sidebar on desktop (lg+), bottom navigation on mobile. */
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
        <WorkspaceShell
          variant="inset"
          className="stay-shell w-full max-w-none"
          sidebar={<AppSidebar />}
        >
          <WorkspaceBody>
            <PageMetaProvider>
              <AppHeader />
              <WorkspaceMain
                id={MAIN_ID}
                tabIndex={-1}
                className="px-4 py-5 pb-bottom-nav outline-none sm:px-6 lg:px-8 lg:py-8"
              >
                <Outlet />
              </WorkspaceMain>
            </PageMetaProvider>
          </WorkspaceBody>
        </WorkspaceShell>
        <BottomNav />
      </SidebarProvider>
    </BuildingProvider>
  );
}

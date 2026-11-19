import { IconButton } from '@itclabs/react-ui';
import { DashboardShell } from '@itclabs/react-ui/templates';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import { ConfirmProvider } from '@/libraries/confirm';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';
import { DashboardRangeSelect, DashboardTitle } from '@/modules/admin/dashboard/dashboard-header';
import AdminBreadcrumb from './breadcrumb';
import AdminPageSearch from './page-search';
import { toPageLinks, useAdminMenu, useAdminSidebar } from './sidebar';

/** Admin frame from the kit's "Sidebar search" dashboard template. */
export default function AdminLayout() {
  const { t } = useTranslation();

  const { pathname } = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);

  const menu = useAdminMenu();

  const sidebar = useAdminSidebar(menu, () => setSearchOpen(true));

  const isDashboard = pathname === ROUTES.admin.dashboard;

  return (
    <ConfirmProvider>
      <DashboardShell
        variant="classic"
        className="w-full max-w-none"
        data-portal="admin"
        sidebarToggle
        sidebar={sidebar}
        header={isDashboard ? <DashboardTitle /> : <AdminBreadcrumb />}
        headerActions={
          <>
            {isDashboard ? <DashboardRangeSelect /> : null}
            <LanguageSwitcher />
            <IconButton variant="ghost" size="sm" icon="bell" label={t('common.notifications')} />
            <UserAccountMenu portal="admin" />
          </>
        }
      >
        <Outlet />
        <AdminPageSearch open={searchOpen} onOpenChange={setSearchOpen} pages={toPageLinks(menu)} />
      </DashboardShell>
    </ConfirmProvider>
  );
}

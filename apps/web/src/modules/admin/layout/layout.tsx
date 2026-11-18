import { DashboardShell } from '@itclabs/react-ui/templates';
import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import { DashboardRangeSelect, DashboardTitle } from '../dashboard/dashboard-header';
import AdminBreadcrumb from './breadcrumb';
import { useAdminSidebar } from './sidebar';
import AdminTopbar from './topbar';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const sidebar = useAdminSidebar();

  const isDashboard = pathname === ROUTES.admin.dashboard;

  return (
    <DashboardShell
      variant="floating"
      className="w-full max-w-none"
      classNames={{ header: 'lg:px-10' }}
      data-portal="admin"
      sidebarToggle
      topbar={<AdminTopbar />}
      sidebar={sidebar}
      header={isDashboard ? <DashboardTitle /> : <AdminBreadcrumb />}
      headerActions={isDashboard ? <DashboardRangeSelect /> : undefined}
    >
      <Outlet />
    </DashboardShell>
  );
}

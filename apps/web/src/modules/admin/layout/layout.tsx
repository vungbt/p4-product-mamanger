import { SidebarProvider, WorkspaceBody, WorkspaceMain, WorkspaceShell } from '@itclabs/react-ui';
import { Outlet } from 'react-router-dom';
import AdminHeader from './header';
import AdminSidebar from './sidebar';
export default function AdminLayout() {
  return (
    <SidebarProvider>
      <WorkspaceShell
        className="admin-shell w-full max-w-none"
        data-portal="admin"
        sidebar={<AdminSidebar />}
      >
        <WorkspaceBody>
          <AdminHeader />
          <WorkspaceMain className="w-full max-w-none px-4 py-6 sm:px-6 sm:py-6 lg:px-6">
            <Outlet />
          </WorkspaceMain>
        </WorkspaceBody>
      </WorkspaceShell>
    </SidebarProvider>
  );
}

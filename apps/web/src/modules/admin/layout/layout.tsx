import { Outlet } from 'react-router-dom';
import AdminHeader from './header';
import AdminSidebar from './sidebar';
import { AdminShellProvider } from './use-admin-shell';

export default function AdminLayout() {
  return (
    <AdminShellProvider>
      <div
        className="flex min-h-screen bg-secondary-background text-neutral-black"
        data-portal="admin"
      >
        <AdminSidebar />
        <main className="flex max-h-screen min-w-0 flex-1 flex-col overflow-auto">
          <AdminHeader />
          <div className="min-h-[calc(100vh-4rem)] flex-1 px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminShellProvider>
  );
}

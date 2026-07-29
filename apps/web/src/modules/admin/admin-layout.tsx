import { Outlet } from 'react-router-dom';
import useAuth from '@/hooks/use-auth';
import MenuLayout from '@/libraries/menu/menu.layout';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, padding: 16, borderRight: '1px solid #ddd' }}>
        <h2>Admin</h2>
        <p style={{ fontSize: 14, color: '#666' }}>{user?.email}</p>
        <div style={{ marginTop: 16 }}>
          <MenuLayout portalName="admin-portal" />
        </div>
        <button type="button" onClick={logout} style={{ marginTop: 24 }}>
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

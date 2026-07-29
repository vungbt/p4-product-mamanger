import { Outlet } from 'react-router-dom';
import useAuth from '@/hooks/use-auth';
import MenuLayout from '@/libraries/menu/menu.layout';

export default function StorefrontLayout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <strong>Storefront</strong>
        <div style={{ display: 'flex', gap: 16 }}>
          <MenuLayout portalName="storefront-portal" variant="horizontal" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>{user?.email}</span>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

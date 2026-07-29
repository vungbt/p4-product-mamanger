import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes, renderMenuItems } from '@/routing/route.types';

type MenuLayoutProps = {
  portalName: 'admin-portal' | 'storefront-portal';
  variant?: 'vertical' | 'horizontal';
};

function MenuLabel({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

export default function MenuLayout({ portalName, variant = 'vertical' }: MenuLayoutProps) {
  const menuRoutes = getPortalMenuRoutes(RouteConfigs, portalName);
  const items = buildMenuItems(menuRoutes);

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: variant === 'horizontal' ? 'row' : 'column',
        gap: variant === 'horizontal' ? 16 : 8,
      }}
    >
      {renderMenuItems(
        items,
        (path, label, key, icon) => (
          <NavLink
            key={key}
            to={path}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              color: isActive ? '#1677ff' : '#333',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <MenuLabel icon={icon} label={label} />
          </NavLink>
        ),
        (label, key, icon, children) => (
          <div key={key} style={{ display: 'grid', gap: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#666',
              }}
            >
              {icon}
              {label}
            </span>
            <div style={{ paddingLeft: icon ? 24 : 12, display: 'grid', gap: 4 }}>{children}</div>
          </div>
        ),
      )}
    </nav>
  );
}

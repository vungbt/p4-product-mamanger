import {
  cn,
  Divider,
  IconButton,
  Sidebar,
  type SidebarNavItem,
  type SidebarSection,
  toastInfo,
  UserChip,
  useCollapsibleShell,
} from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes, type MenuItem } from '@/routing/route.types';

export default function AdminSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { collapsed } = useCollapsibleShell();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.admin.login, { replace: true });
  };

  // Convert the `MenuItem` tree (built from RouteConfigs — see the old menu.layout.tsx) into
  // `SidebarNavItem` for the `Sidebar` module: computes `active` from the current route and
  // handles SPA navigation via `navigate` itself, since `Sidebar` (libs/ui) has no react-router
  // dependency — this logic belongs to the app, not the lib.
  const toSidebarItems = (items: MenuItem[]): SidebarNavItem[] =>
    items.map((item) => {
      const label = t(`menu.${item.name}`, { defaultValue: item.label });

      if (item.type === 'submenu') {
        return {
          key: item.name,
          icon: item.icon,
          label,
          title: label,
          children: toSidebarItems(item.children),
        };
      }

      return {
        key: item.name,
        icon: item.icon,
        label,
        title: label,
        href: item.path,
        active: location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
        onClick: (event) => {
          event.preventDefault();
          navigate(item.path);
        },
      };
    });

  const sections: SidebarSection[] = [
    {
      key: 'main',
      items: toSidebarItems(buildMenuItems(getPortalMenuRoutes(RouteConfigs, 'admin-portal'))),
    },
  ];

  return (
    <Sidebar
      collapsed={collapsed}
      customClasses={{ brand: 'flex-col items-stretch px-0 pb-4' }}
      logo={
        <>
          <Link
            to={ROUTES.admin.dashboard}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg bg-primary-background px-2 py-2 outline-none transition-all ease-linear focus-visible:shadow-focus-ring',
              collapsed ? 'justify-center' : 'justify-start',
            )}
          >
            <BrandLogo variant="mark" height={36} />
            {!collapsed ? (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-14 font-semibold text-neutral-black">
                  {t('app.admin')}
                </p>
                <p className="truncate text-12 text-neutral-text-secondary">
                  {t('app.adminSubtitle')}
                </p>
              </div>
            ) : null}
          </Link>
          <Divider className="h-0.5 bg-primary-base" />
        </>
      }
      sections={sections}
      footer={
        collapsed ? (
          <div className="flex w-full flex-col items-center gap-1">
            <IconButton
              icon="settings"
              color="primary"
              variant="default"
              shape="square"
              title={t('common.settings')}
              onClick={() => toastInfo(t('common.settingsSoon'))}
            />
            <IconButton
              icon="log-out"
              color="error"
              variant="ghost"
              shape="square"
              title={t('common.logout')}
              onClick={handleLogout}
            />
          </div>
        ) : (
          <UserChip
            name={user?.email ?? t('app.admin')}
            subtitle={<span className="capitalize">{user?.role ?? 'admin'}</span>}
            avatarUrl={user?.avatarUrl}
            className="w-full justify-between"
            dropdownItems={[
              {
                key: 'settings',
                label: t('common.settings'),
                onClick: () => toastInfo(t('common.settingsSoon')),
              },
              {
                key: 'logout',
                label: t('common.logout'),
                danger: true,
                onClick: handleLogout,
              },
            ]}
          />
        )
      }
    />
  );
}

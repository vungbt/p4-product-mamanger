import { cn, RenderIcon } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import MenuLayout from '@/libraries/menu/menu.layout';
import { useAdminShell } from './use-admin-shell';

export default function AdminSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed } = useAdminShell();

  const footerBtnClass = cn(
    'flex w-full items-center gap-2 rounded-xl px-3 py-3 text-15 font-medium transition-all ease-linear',
    'text-neutral-text-primary hover:bg-primary-background hover:text-primary',
    collapsed && 'justify-center px-2',
  );

  const handleLogout = () => {
    logout();
    navigate(ROUTES.admin.login, { replace: true });
  };

  return (
    <aside
      className={cn(
        'relative flex min-h-screen shrink-0 flex-col overflow-y-auto border-r border-solid border-primary-background bg-neutral-white p-4 transition-all ease-linear',
        collapsed ? 'w-20 min-w-20' : 'w-56 min-w-56',
      )}
    >
      <Link
        to={ROUTES.admin.dashboard}
        className={cn(
          'mb-4 flex w-full items-center gap-2 rounded-lg bg-primary-background px-2 py-2 transition-all ease-linear',
          collapsed ? 'justify-center' : 'justify-start',
        )}
      >
        <BrandLogo variant="mark" height={36} />
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-14 font-semibold text-neutral-black">{t('app.admin')}</p>
            <p className="truncate text-12 text-neutral-text-secondary">{t('app.adminSubtitle')}</p>
          </div>
        ) : null}
      </Link>

      <div className="mb-4 h-0.5 w-full bg-primary-base" />

      <MenuLayout
        portalName="admin-portal"
        variant="vertical"
        collapsed={collapsed}
        appearance="soft"
      />

      <div className="mt-auto pt-4">
        <div className="mb-3 h-px w-full bg-neutral-border" />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            title={collapsed ? t('common.settings') : undefined}
            className={footerBtnClass}
            onClick={() => toast.info(t('common.settingsSoon'))}
          >
            <RenderIcon name="settings" className="!h-5 !w-5 shrink-0" />
            {!collapsed ? <span>{t('common.settings')}</span> : null}
          </button>

          <button
            type="button"
            title={collapsed ? t('common.logout') : undefined}
            className={cn(footerBtnClass, 'text-error hover:bg-error-bg hover:text-error')}
            onClick={handleLogout}
          >
            <RenderIcon name="log-out" className="!h-5 !w-5 shrink-0" />
            {!collapsed ? <span>{t('common.logout')}</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

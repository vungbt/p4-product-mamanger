import { cn, RenderIcon } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import MenuLayout from '@/libraries/menu/menu.layout';
import { useAdminShell } from './use-admin-shell';

export default function AdminSidebar() {
  const { t } = useTranslation();
  const { collapsed } = useAdminShell();

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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <RenderIcon name="package" style={{ width: 18, height: 18 }} />
        </span>
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
    </aside>
  );
}

import { AdminHeader, IconButton, ThemeToggle, UserChip, useCollapsibleShell } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/use-auth';
import LanguageSwitcher from '@/libraries/language-switcher';
import useAdminBreadcrumbs from './use-admin-breadcrumbs';

export default function AdminHeaderBar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { collapsed, toggleCollapsed } = useCollapsibleShell();
  const breadcrumbs = useAdminBreadcrumbs();

  return (
    <AdminHeader
      breadcrumbs={breadcrumbs}
      leading={
        <IconButton
          icon={collapsed ? 'collapse-right' : 'collapse-left'}
          color="primary"
          variant="default"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
        />
      }
      actions={
        <>
          <ThemeToggle />
          <LanguageSwitcher />

          {/* <IconButton
            icon="bell"
            color="primary"
            variant="default"
            aria-label={t("common.notifications")}
          /> */}
          <IconButton
            icon="bell"
            shape="square"
            variant="outline"
            color="neutral"
            badge={3}
            badgeColor="error"
            aria-label={t('common.notifications')}
          />

          <UserChip
            name={user?.email ?? t('app.admin')}
            subtitle={<span className="capitalize">{user?.role ?? 'admin'}</span>}
            avatarUrl={user?.avatarUrl}
            dropdownItems={[
              {
                key: 'logout',
                label: t('common.logout'),
                danger: true,
                onClick: logout,
              },
            ]}
          />
        </>
      }
    />
  );
}

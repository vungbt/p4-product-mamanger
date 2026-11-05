import { Breadcrumb, IconButton, WorkspaceHeader } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';
import useAdminBreadcrumbs from './use-admin-breadcrumbs';
export default function AdminHeaderBar() {
  const { t } = useTranslation();
  const breadcrumbs = useAdminBreadcrumbs();
  return (
    <WorkspaceHeader
      className="flex-nowrap bg-surface pl-14 sm:pl-14 lg:pl-8"
      actionsClassName="ml-auto"
      breadcrumb={
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <Breadcrumb
            items={breadcrumbs.map(({ key, label }) => ({ key, title: label }))}
            className="min-w-0 hidden sm:block"
          />
        </div>
      }
      actions={
        <>
          <LanguageSwitcher />
          <IconButton icon="bell" variant="ghost" label={t('common.notifications')} />
          <UserAccountMenu portal="admin" />
        </>
      }
    />
  );
}

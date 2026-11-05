import { type DropdownMenuEntry, UserMenu } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';

type UserAccountMenuProps = {
  portal?: 'admin' | 'storefront';
  placement?: 'header' | 'sidebar';
};
export default function UserAccountMenu({
  portal = 'storefront',
  placement = 'header',
}: UserAccountMenuProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const displayName = user.displayName?.trim() || user.email.split('@')[0] || user.email;
  const items: DropdownMenuEntry[] = [
    portal === 'admin'
      ? {
          id: 'settings',
          icon: 'settings',
          label: t('common.settings'),
          onSelect: () => {
            toast.info(t('common.settingsSoon'));
          },
        }
      : {
          id: 'password',
          icon: 'key',
          label: user.hasPassword ? t('auth.changePassword') : t('auth.setPassword'),
          onSelect: () => navigate(ROUTES.storefront.password),
        },
    {
      id: 'logout',
      icon: 'logout',
      label: t('common.logout'),
      tone: 'danger',
      onSelect: () => {
        logout();
        navigate(portal === 'admin' ? ROUTES.admin.login : ROUTES.storefront.login, {
          replace: true,
        });
      },
    },
  ];
  return (
    <UserMenu
      name={displayName}
      description={user.email}
      avatar={{ src: user.avatarUrl || undefined }}
      collapseOnMobile={placement !== 'sidebar'}
      className={placement === 'sidebar' ? 'w-full' : undefined}
      classNames={
        placement === 'sidebar'
          ? {
              trigger:
                'w-full border-transparent bg-transparent hover:bg-surface/60 group-data-[collapsed=true]/sidebar:justify-center',
              details: 'group-data-[collapsed=true]/sidebar:hidden',
              chevron: 'group-data-[collapsed=true]/sidebar:hidden',
            }
          : undefined
      }
      items={items}
      header={user.email}
    />
  );
}

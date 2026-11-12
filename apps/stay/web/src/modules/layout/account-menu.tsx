import { type DropdownMenuEntry, UserMenu } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/libraries/session/auth-provider';
import { ROUTES } from '@/routing/route-configs';

/** Header account menu: notification settings, change password (placeholder) and sign out. */
export default function AccountMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const name = user.displayName.trim() || user.email;

  const items: DropdownMenuEntry[] = [
    {
      id: 'notifications',
      icon: 'bell',
      label: t('account.notifications'),
      onSelect: () =>
        navigate(user.role === 'tenant' ? '/my/notifications' : ROUTES.notificationSettings),
    },
    {
      id: 'password',
      icon: 'key',
      label: t('account.changePassword'),
      onSelect: () => navigate('/account/password'),
    },
    { id: 'separator', type: 'separator' },
    {
      id: 'sign-out',
      icon: 'logout',
      label: t('account.signOut'),
      tone: 'danger',
      onSelect: () => {
        void signOut();
        toast.success(t('account.signedOut'));
        navigate(ROUTES.login, { replace: true });
      },
    },
  ];

  return (
    <UserMenu
      name={name}
      description={t(`roles.${user.role}`)}
      avatar={{ src: user.avatarUrl ?? undefined }}
      label={t('account.menu')}
      collapseOnMobile
      header={user.role === 'tenant' ? user.displayName : user.email}
      items={items}
      data-testid="account-menu"
    />
  );
}

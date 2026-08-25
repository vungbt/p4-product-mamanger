import { Avatar, cn, Menu, type MenuEntry } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';

type UserAccountMenuProps = {
  className?: string;
};

export default function UserAccountMenu({ className }: UserAccountMenuProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || user.email || 'User';

  const items: MenuEntry[] = [
    {
      key: 'password',
      label: user.hasPassword ? t('auth.changePassword') : t('auth.setPassword'),
      onClick: () => navigate(ROUTES.storefront.password),
    },
    {
      key: 'logout',
      label: t('common.logout'),
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Menu
      trigger={
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full p-0.5 outline-none transition',
            'ring-1 ring-neutral-border hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary',
            className,
          )}
          aria-label={user.email}
        >
          <Avatar name={displayName} src={user.avatarUrl || undefined} size="md" />
        </button>
      }
      align="end"
      items={items}
      header={
        <>
          <p className="truncate text-13 font-semibold text-neutral-text-primary">{displayName}</p>
          <p className="truncate text-12 text-neutral-text-secondary">{user.email}</p>
        </>
      }
      customClasses={{
        menu: 'min-w-[220px] bg-neutral-white border border-neutral-border rounded-xl shadow-2xl overflow-hidden',
        item: 'text-13 px-3 py-2.5 cursor-pointer hover:bg-neutral-background transition-colors',
        dangerItem:
          'text-13 px-3 py-2.5 cursor-pointer text-error hover:bg-error-bg transition-colors',
      }}
    />
  );
}

import { Avatar, cn } from '@p4/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/use-auth';

type UserAccountMenuProps = {
  className?: string;
};

export default function UserAccountMenu({ className }: UserAccountMenuProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || user.email || 'User';

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full p-0.5 outline-none transition',
          'ring-1 ring-neutral-border hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary',
        )}
        aria-label={user.email}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={displayName} src={user.avatarUrl || undefined} size="md" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-[60] mt-2 min-w-[220px] overflow-hidden rounded-xl border border-neutral-border bg-neutral-white py-1 shadow-2xl"
        >
          <div className="border-b border-neutral-border px-3 py-2.5">
            <p className="truncate text-13 font-semibold text-neutral-text-primary">
              {displayName}
            </p>
            <p className="truncate text-12 text-neutral-text-secondary">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2.5 text-left text-13 text-error transition-colors hover:bg-error-bg"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            {t('common.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

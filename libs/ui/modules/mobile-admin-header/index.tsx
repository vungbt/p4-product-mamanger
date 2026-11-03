import type { ReactNode } from 'react';
import { Avatar, IconButton } from '../../components';
import { cn } from '../../helpers';

export type MobileAdminProps = {
  label: string;
  time: string;
  title: string;
  trailing?: 'avatar' | 'action' | ReactNode;
  userInitials?: string;
  onMenuClick?: () => void;
  className?: string;
};

export function MobileAdminHeader({
  label,
  time,
  title,
  trailing = 'avatar',
  userInitials,
  onMenuClick,
  className,
}: MobileAdminProps) {
  const renderTrailing = () => {
    if (trailing === 'avatar') {
      return <Avatar name={userInitials} size="sm" />;
    }
    if (trailing === 'action') {
      return (
        <IconButton
          type="button"
          icon="add"
          className="border bg-primary rounded-xl text-neutral-white "
        />
      );
    }
    return trailing;
  };
  return (
    <header
      className={cn(
        'flex flex-col border border-neutral-border rounded-xl bg-neutral-white overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between text-10 font-bold px-3.5 py-1">
        <div className="">{time}</div>
        <div className="">{label}</div>
      </div>
      <div className="flex   items-center  justify-between border-t border-neutral-border w-full  gap-2.5 px-3.5 py-1">
        <div className="flex items-center gap-2.5">
          <IconButton
            type="button"
            icon="menu"
            onClick={onMenuClick}
            className="border border-neutral-border hover:bg-neutral-bg rounded-xl text-neutral-text-secondary"
          />
          <span className="flex-1 text-14 font-extrabold">{title}</span>
        </div>
        {renderTrailing()}
      </div>
    </header>
  );
}

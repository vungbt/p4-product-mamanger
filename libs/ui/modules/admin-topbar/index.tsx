import { Breadcrumb } from '../../components';
import { IconButton } from '../../components/icon-button';
import { UserChip } from '../../components/user-chip';
import { cn } from '../../helpers/utils';

export type AdminTopbarProps = {
  breadcrumb: {
    label: string;
    href?: string;
  }[];
  notifCount?: number;
  user: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  onBellClick?: () => void;
  className?: string;
};

export const AdminTopbar = ({
  breadcrumb,
  notifCount,
  user,
  onBellClick,
  className,
}: AdminTopbarProps) => {
  return (
    <header
      className={cn(
        'flex items-center w-full justify-between bg-neutral-white rounded-xl border border-neutral-border px-6 py-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-13.5">
        <Breadcrumb
          separator="›"
          itemClassName="text-13.5"
          items={breadcrumb.map((b) => ({ title: b.label, href: b.href }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <IconButton
          icon="bell"
          variant="outline"
          color="neutral"
          shape="square"
          aria-label="Thông báo"
          className="relative rounded-lg p-2"
          badge={notifCount && notifCount > 0 ? notifCount : undefined}
          badgeColor="primary"
          onClick={onBellClick}
        />
        <UserChip
          className="border-none "
          name={user.name}
          subtitle={user.role}
          avatarUrl={user.avatarUrl}
          customClasses={{
            avatar: 'bg-neutral-text-secondary text-11 text-neutral-white border-none w-9 h-9',
          }}
        />
      </div>
    </header>
  );
};

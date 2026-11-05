import { cn, Tag } from '@itclabs/react-ui';
export type AddressCardProps = {
  title?: string;
  fullName: string;
  phone: string;
  badge?: string;
  isDefault?: boolean;
  address?: string;
  className?: string;
};
export const AddressCard = ({
  className,
  title = 'Địa chỉ giao hàng',
  fullName,
  phone,
  address,
  badge = 'Mặc định',
  isDefault = false,
}: AddressCardProps) => {
  return (
    <div
      className={cn(
        'border rounded-2xl flex flex-col min-w-80 border-line bg-surface break-words p-5',
        className,
      )}
    >
      <div className={cn('flex justify-between items-center mb-3')}>
        <span className="font-extrabold text-sm">{title}</span>
        {isDefault && (
          <Tag tone="success" size="sm">
            {badge}
          </Tag>
        )}
      </div>
      <div className="flex gap-2 font-bold text-sm">
        <span className="">{fullName}</span>
        {fullName && phone && <span>·</span>}
        <span className="">{phone}</span>
      </div>
      <div className="text-ui-sm mt-1 text-muted">{address}</div>
    </div>
  );
};

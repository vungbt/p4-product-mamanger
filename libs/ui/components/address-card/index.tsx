import { cn } from '../../helpers/utils';
import { Tag } from '../tag';
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
        'border rounded-2xl flex flex-col min-w-80 border-neutral-border bg-neutral-white break-words p-5',
        className,
      )}
    >
      <div className={cn('flex justify-between items-center mb-3')}>
        <span className="font-extrabold text-sm">{title}</span>
        {isDefault && (
          <Tag
            content={badge}
            type="default"
            color="success"
            className="!px-2.5 !py-1 !text-11 rounded-full"
          />
        )}
      </div>
      <div className="flex gap-2 font-bold text-sm">
        <span className="">{fullName}</span>
        {fullName && phone && <span>·</span>}
        <span className="">{phone}</span>
      </div>
      <div className="text-13 mt-1 text-neutral-text-secondary">{address}</div>
    </div>
  );
};

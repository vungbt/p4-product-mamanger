import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
import { Button } from '../button';
import { RenderIcon } from '../icons';
import { Input } from '../input';

export type CouponInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  appliedCoupon?: {
    code: string;
    discountLabel: string;
  };
  loading?: boolean;
  className?: string;
  placeholder?: string;
};

export function CouponInputBar({
  value,
  onChange,
  onApply,
  onRemove,
  appliedCoupon,
  loading,
  className,
  placeholder,
}: CouponInputBarProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-2.5 w-full', className)}>
      {appliedCoupon ? (
        <div className="flex h-10 flex-1 items-center justify-between rounded-lg border border-success-border bg-success-bg px-3.5">
          <span className="font-mono text-13 font-bold text-success">
            {appliedCoupon.code} {appliedCoupon.discountLabel}
          </span>
          <Button
            type="button"
            onClick={onRemove}
            aria-label="Remove coupon"
            className="flex  items-center justify-center text-success bg-transparent"
          >
            <RenderIcon name="close" className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <Input
            type="text"
            value={value}
            disabled={loading}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || t('couponInputBar.placeholder')}
            className="h-10 flex-1 rounded-lg border border-neutral-border bg-neutral-white px-4 text-14 text-neutral-text-primary outline-none transition-all placeholder:text-neutral-placeholder focus:border-primary focus:shadow-focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="button"
            color="neutral"
            variant="outline"
            onClick={onApply}
            loading={loading}
          >
            {loading ? t('couponInputBar.loading') : t('couponInputBar.apply')}
          </Button>
        </>
      )}
    </div>
  );
}

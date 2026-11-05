import { Button, cn, IconButton, Input } from '@itclabs/react-ui';
import { CloseIcon } from '@itclabs/react-ui/icons/outline';
import { useTranslation } from 'react-i18next';

export type CouponInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  couponCode?: string;
  loading?: boolean;
  className?: string;
  placeholder?: string;
};

export function CouponInputBar({
  value,
  onChange,
  onApply,
  onRemove,
  couponCode,
  loading,
  className,
  placeholder,
}: CouponInputBarProps) {
  const { t } = useTranslation('blocks');
  return (
    <div className={cn('flex items-center gap-2.5 w-full', className)}>
      {couponCode ? (
        <div className="flex h-10 flex-1 items-center justify-between rounded-lg border border-success-700 bg-success-50 px-3.5">
          <span className="font-mono text-ui-sm font-bold text-success-700">
            {t('couponInputBar.applied', { code: couponCode })}
          </span>
          <IconButton
            icon={CloseIcon}
            variant="ghost"
            size="sm"
            onClick={onRemove}
            label={t('couponInputBar.remove')}
          />
        </div>
      ) : (
        <>
          <Input
            type="text"
            value={value}
            disabled={loading}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || t('couponInputBar.placeholder')}
            rootClassName="flex-1"
          />
          <Button type="button" variant="secondary" onClick={onApply} loading={loading}>
            {loading ? t('couponInputBar.loading') : t('couponInputBar.apply')}
          </Button>
        </>
      )}
    </div>
  );
}

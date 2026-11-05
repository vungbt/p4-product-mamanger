import { RadioGroup } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
export type PaymentMethodOption = { value: string; label: string };
export type PaymentMethodSelectorProps = {
  options: PaymentMethodOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
};
export function PaymentMethodSelector({
  options,
  value,
  onChange,
  className,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation('blocks');
  return (
    <RadioGroup
      label={t('paymentMethodSelector.label')}
      options={options}
      value={value}
      onValueChange={onChange}
      orientation="horizontal"
      className={className}
      classNames={{ group: 'flex flex-wrap gap-3' }}
    />
  );
}

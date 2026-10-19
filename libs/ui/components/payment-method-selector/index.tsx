import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

export type PaymentMethodOption = {
  value: string;
  label: string;
};

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
  return (
    <div className={cn('flex gap-2.5 w-full flex-wrap', className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 flex items-center gap-2.5 py-3.5 px-4 rounded-xl border transition-all cursor-pointer text-left',
              isSelected
                ? 'border-primary-border bg-primary-background'
                : 'border-neutral-border bg-neutral-white hover:border-neutral',
            )}
          >
            <span className={cn('flex items-center justify-center shrink-0')}>
              <RenderIcon
                name={isSelected ? 'radio-solid' : 'radio-outline'}
                className={isSelected ? 'text-primary' : 'text-neutral'}
              />
            </span>

            <span
              className={cn(
                'text-13.5 transition-colors',
                isSelected ? 'font-bold text-primary-clicked' : 'font-semibold text-secondary',
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

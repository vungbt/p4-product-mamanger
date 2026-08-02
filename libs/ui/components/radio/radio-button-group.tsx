import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '../../lib/utils';
import { getIconSize, type Size } from '../common';
import { type IconName, RenderIcon } from '../icons';

export type RadioButtonGroupColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'pending'
  | 'neutral';

export type RadioButtonOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  icon?: IconName;
  disabled?: boolean;
};

export type RadioButtonGroupProps<T extends string = string> = {
  options: RadioButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: Size;
  color?: RadioButtonGroupColor;
  equalWidth?: boolean;
  customClasses?: { root?: string; item?: string };
};

const sizeClasses: Record<Size, string> = {
  small: 'px-2 py-1 text-sm gap-1.5',
  middle: 'px-4 py-2 text-base gap-2',
  large: 'px-6 py-3 text-lg gap-2',
};

const selectedClasses: Record<RadioButtonGroupColor, string> = {
  primary: 'bg-primary text-white hover:bg-primary-base',
  secondary: 'bg-secondary text-white hover:bg-secondary-base',
  success: 'bg-success text-white hover:bg-success-base',
  error: 'bg-error text-white hover:bg-error-base',
  pending: 'bg-pending text-white hover:bg-pending-base',
  neutral: 'bg-neutral-black text-white hover:bg-neutral-text-primary',
};

const unselectedClasses =
  'bg-transparent text-neutral-text-secondary hover:bg-neutral-bg hover:text-neutral-black';

export function RadioButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className,
  size = 'small',
  color = 'neutral',
  equalWidth = false,
  customClasses,
}: RadioButtonGroupProps<T>) {
  const reactId = useId();
  const groupName = name ?? `radio-btn-group-${reactId.replace(/:/g, '')}`;

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-lg border border-neutral-border bg-white',
        className,
        customClasses?.root,
      )}
    >
      {options.map((opt, index) => {
        const checked = value === opt.value;
        const itemDisabled = disabled || opt.disabled;
        const isLast = index === options.length - 1;
        return (
          <label
            key={String(opt.value)}
            className={cn(
              'flex min-w-0 cursor-pointer select-none items-center justify-center font-medium',
              'transition-[color,background-color,box-shadow] duration-200 ease-out',
              'motion-reduce:transition-none',
              // Separators between segments only; no rounding between items (outer clip handles corners).
              !isLast && 'border-r border-neutral-border',
              equalWidth && 'flex-1',
              sizeClasses[size],
              checked ? selectedClasses[color] : unselectedClasses,
              itemDisabled &&
                'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-neutral-text-secondary',
              customClasses?.item,
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={groupName}
              value={opt.value}
              checked={checked}
              disabled={itemDisabled}
              onChange={() => !itemDisabled && onChange(opt.value)}
            />
            {opt.icon ? (
              <RenderIcon name={opt.icon} className={cn(getIconSize(size), 'shrink-0')} />
            ) : null}
            <span className="whitespace-nowrap">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

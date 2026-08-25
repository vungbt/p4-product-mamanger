import { forwardRef, type InputHTMLAttributes, useCallback } from 'react';
import { cn } from '../../helpers/utils';
import type { Size } from '../common';
import { type IconName, RenderIcon } from '../icons';

export type InputNumberProps = {
  className?: string;
  disabled?: boolean;
  size?: Size;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'outline' | 'solid' | 'subtle';
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Icon name for the decrement button. Defaults to `minus`. */
  decrementIcon?: IconName;
  /** Icon name for the increment button. Defaults to `plus`. */
  incrementIcon?: IconName;
  error?: string;
  label?: string;
  required?: boolean;
  customClasses?: {
    root?: string;
    input?: string;
    button?: string;
    label?: string;
    error?: string;
  };
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange' | 'value' | 'defaultValue' | 'type'
>;

const sizeClasses: Record<Size, { root: string; input: string; button: string; icon: string }> = {
  small: {
    root: 'h-8',
    input: 'w-12 text-14',
    button: 'w-8 h-8',
    icon: '!h-3.5 !w-3.5',
  },
  middle: {
    root: 'h-10',
    input: 'w-14 text-16',
    button: 'w-10 h-10',
    icon: '!h-4 !w-4',
  },
  large: {
    root: 'h-11',
    input: 'w-16 text-16',
    button: 'w-11 h-11',
    icon: '!h-5 !w-5',
  },
};

const colorClasses = {
  primary: {
    outline: {
      border: 'border-primary',
      button: 'text-primary hover:bg-primary-background active:bg-primary-border',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
    solid: {
      border: 'border-primary bg-primary-background',
      button: 'text-primary hover:bg-primary-border/30 active:bg-primary-border/50',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
    subtle: {
      border: 'border-primary-border bg-primary-background',
      button: 'text-primary-clicked hover:bg-primary-border/30 active:bg-primary-border/50',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
  },
  secondary: {
    outline: {
      border: 'border-secondary',
      button: 'text-secondary hover:bg-secondary-background active:bg-secondary-border/30',
      focus: 'focus-within:border-secondary',
    },
    solid: {
      border: 'border-secondary bg-secondary-background',
      button: 'text-secondary hover:bg-secondary-border/30 active:bg-secondary-border/50',
      focus: 'focus-within:border-secondary',
    },
    subtle: {
      border: 'border-secondary-border bg-secondary-background',
      button: 'text-secondary-clicked hover:bg-secondary-border/30 active:bg-secondary-border/50',
      focus: 'focus-within:border-secondary',
    },
  },
  success: {
    outline: {
      border: 'border-success',
      button: 'text-success hover:bg-success-bg active:bg-success-border/30',
      focus: 'focus-within:border-success',
    },
    solid: {
      border: 'border-success bg-success-bg',
      button: 'text-success hover:bg-success-border/30 active:bg-success-border/50',
      focus: 'focus-within:border-success',
    },
    subtle: {
      border: 'border-success-border bg-success-bg',
      button: 'text-success hover:bg-success-border/30 active:bg-success-border/50',
      focus: 'focus-within:border-success',
    },
  },
  error: {
    outline: {
      border: 'border-error',
      button: 'text-error hover:bg-error-bg active:bg-error-border/30',
      focus: 'focus-within:border-error',
    },
    solid: {
      border: 'border-error bg-error-bg',
      button: 'text-error hover:bg-error-border/30 active:bg-error-border/50',
      focus: 'focus-within:border-error',
    },
    subtle: {
      border: 'border-error-border bg-error-bg',
      button: 'text-error hover:bg-error-border/30 active:bg-error-border/50',
      focus: 'focus-within:border-error',
    },
  },
  pending: {
    outline: {
      border: 'border-pending',
      button: 'text-pending hover:bg-pending-bg active:bg-pending-border/30',
      focus: 'focus-within:border-pending',
    },
    solid: {
      border: 'border-pending bg-pending-bg',
      button: 'text-pending hover:bg-pending-border/30 active:bg-pending-border/50',
      focus: 'focus-within:border-pending',
    },
    subtle: {
      border: 'border-pending-border bg-pending-bg',
      button: 'text-pending hover:bg-pending-border/30 active:bg-pending-border/50',
      focus: 'focus-within:border-pending',
    },
  },
  neutral: {
    outline: {
      border: 'border-neutral-border',
      button: 'text-neutral-text-secondary hover:bg-neutral-bg active:bg-neutral-border',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
    solid: {
      border: 'border-neutral-border bg-neutral-bg',
      button: 'text-neutral-text-secondary hover:bg-neutral-border/50 active:bg-neutral-border',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
    subtle: {
      border: 'border-neutral-border bg-neutral-bg',
      button: 'text-neutral-text-secondary hover:bg-neutral-border/50 active:bg-neutral-border',
      focus: 'focus-within:border-primary focus-within:shadow-focus-ring',
    },
  },
};

export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      className,
      disabled,
      size = 'middle',
      color = 'neutral',
      variant = 'outline',
      min,
      max,
      step = 1,
      value,
      defaultValue,
      onChange,
      decrementIcon = 'minus',
      incrementIcon = 'plus',
      error,
      label,
      required,
      customClasses,
      ...rest
    },
    ref,
  ) => {
    const sizeClass = sizeClasses[size];
    const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];

    const clamp = useCallback(
      (val: number) => {
        let clamped = val;
        if (min !== undefined && clamped < min) clamped = min;
        if (max !== undefined && clamped > max) clamped = max;
        return clamped;
      },
      [min, max],
    );

    const currentValue = value ?? defaultValue ?? 0;

    const handleDecrement = () => {
      if (disabled) return;
      const next = clamp(currentValue - step);
      onChange?.(next);
    };

    const handleIncrement = () => {
      if (disabled) return;
      const next = clamp(currentValue + step);
      onChange?.(next);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const raw = e.target.value;
      if (raw === '' || raw === '-') return;
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        onChange?.(clamp(parsed));
      }
    };

    const isAtMin = min !== undefined && currentValue <= min;
    const isAtMax = max !== undefined && currentValue >= max;

    return (
      <div className={cn('w-fit', customClasses?.root)}>
        {label && (
          <span className={cn('mb-1.5 block text-14 font-semibold', customClasses?.label)}>
            {label}
            {required && <span className="ml-0.5 text-error">*</span>}
          </span>
        )}
        <div
          className={cn(
            'inline-flex items-center overflow-hidden rounded-lg border transition-all',
            sizeClass.root,
            colorClass.border,
            colorClass.focus,
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          <button
            type="button"
            disabled={disabled || isAtMin}
            onClick={handleDecrement}
            aria-label="Decrease"
            className={cn(
              'flex shrink-0 items-center justify-center border-r border-inherit transition-colors',
              sizeClass.button,
              colorClass.button,
              (disabled || isAtMin) && 'opacity-40 cursor-not-allowed',
              customClasses?.button,
            )}
          >
            <RenderIcon name={decrementIcon} className={sizeClass.icon} />
          </button>

          <input
            {...rest}
            ref={ref}
            type="text"
            inputMode="numeric"
            value={currentValue}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'border-none bg-transparent text-center font-semibold outline-none',
              sizeClass.input,
              disabled && 'cursor-not-allowed',
              customClasses?.input,
            )}
          />

          <button
            type="button"
            disabled={disabled || isAtMax}
            onClick={handleIncrement}
            aria-label="Increase"
            className={cn(
              'flex shrink-0 items-center justify-center border-l border-inherit transition-colors',
              sizeClass.button,
              colorClass.button,
              (disabled || isAtMax) && 'opacity-40 cursor-not-allowed',
              customClasses?.button,
            )}
          >
            <RenderIcon name={incrementIcon} className={sizeClass.icon} />
          </button>
        </div>

        {error && <p className={cn('mt-1 text-13 text-error', customClasses?.error)}>{error}</p>}
      </div>
    );
  },
);

InputNumber.displayName = 'InputNumber';

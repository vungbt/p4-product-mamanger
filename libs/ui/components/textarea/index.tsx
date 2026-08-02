import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { getPlaceholderTextClass, type Size } from '../common';
import { FormLabel } from '../form/form-label';

export type TextareaProps = {
  className?: string;
  disabled?: boolean;
  size?: Size;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'solid' | 'outline' | 'subtle' | 'ghost';
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  customClasses?: {
    root?: string;
    label?: string;
    input?: string;
    helperText?: string;
    error?: string;
  };
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>;

const sizeClasses: Record<Size, string> = {
  small: 'px-2 py-1 text-14 min-h-[4.5rem]',
  middle: 'min-h-24 px-4 py-2 text-14',
  large: 'min-h-28 px-6 py-3 text-16',
};

const colorClasses = {
  primary: {
    solid: 'bg-primary-background border-primary text-primary-base focus:border-primary',
    outline: 'bg-transparent border-primary text-primary-base focus:border-primary-base',
    subtle:
      'bg-primary-background border-primary-background text-primary-base focus:border-primary',
    ghost:
      'text-primary bg-transparent border border-dashed border-primary hover:bg-primary-background',
  },
  secondary: {
    solid: 'bg-secondary-background border-secondary text-secondary-base focus:border-secondary',
    outline: 'bg-transparent border-secondary text-secondary-base focus:border-secondary-base',
    subtle:
      'bg-secondary-background border-secondary-background text-secondary-base focus:border-secondary',
    ghost:
      'text-secondary bg-transparent border border-dashed border-secondary hover:bg-secondary-background',
  },
  success: {
    solid: 'bg-success-bg border-success text-success focus:border-success-base',
    outline: 'bg-transparent border-success text-success focus:border-success-base',
    subtle: 'bg-success-bg border-success-bg text-success focus:border-success',
    ghost: 'text-success bg-transparent border border-dashed border-success hover:bg-success-bg',
  },
  error: {
    solid: 'bg-error-bg border-error focus:border-error-base',
    outline: 'bg-transparent border-error focus:border-error-base',
    subtle: 'bg-error-bg border-error-bg focus:border-error',
    ghost: 'bg-transparent border border-dashed border-error hover:bg-error-bg',
  },
  pending: {
    solid: 'bg-pending-bg border-pending text-pending focus:border-pending-base',
    outline: 'bg-transparent border-pending text-pending focus:border-pending-base',
    subtle: 'bg-pending-bg border-pending-bg text-pending focus:border-pending',
    ghost: 'text-pending bg-transparent border border-dashed border-pending hover:bg-pending-bg',
  },
  neutral: {
    solid: 'bg-neutral-bg border-neutral text-neutral-text-primary focus:border-primary-border',
    outline: 'bg-transparent border-neutral text-neutral-text-primary focus:border-primary-border',
    subtle: 'bg-neutral-bg border-neutral-bg text-neutral-text-primary focus:border-primary-border',
    ghost:
      'text-neutral-text-primary bg-transparent border border-dashed border-primary-border hover:bg-neutral-bg',
  },
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      disabled,
      size = 'middle',
      color = 'neutral',
      variant = 'outline',
      label,
      helperText,
      error,
      required,
      customClasses,
      id,
      ...rest
    },
    ref,
  ) => {
    const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];
    const helperTextSize = size === 'large' ? 'text-16' : 'text-14';

    return (
      <div className={cn('w-full', customClasses?.root)}>
        {label && (
          <FormLabel id={id} size={size} required={required} className={customClasses?.label}>
            {label}
          </FormLabel>
        )}

        <textarea
          {...rest}
          ref={ref}
          id={id}
          className={cn(
            'w-full resize-y border rounded-lg transition-all ease-in-out outline-none placeholder:text-neutral-placeholder',
            getPlaceholderTextClass(size),
            sizeClasses[size],
            colorClass,
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            className,
            customClasses?.input,
          )}
          disabled={disabled}
        />

        {error ? (
          <p className={cn('mt-1 text-error', helperTextSize, customClasses?.error)}>{error}</p>
        ) : helperText ? (
          <p
            className={cn(
              'mt-1 text-neutral-placeholder',
              helperTextSize,
              customClasses?.helperText,
            )}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

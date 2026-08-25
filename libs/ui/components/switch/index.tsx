import type React from 'react';
import { cn } from '../../helpers/utils';

export type SwitchSize = 'small' | 'middle' | 'large';
export type SwitchColor = 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Whether the switch is on. Controlled mode. */
  checked?: boolean;
  /** Default checked state for uncontrolled mode. */
  defaultChecked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: SwitchSize;
  color?: SwitchColor;
  label?: React.ReactNode;
  /** Label placement relative to the switch track. */
  labelPlacement?: 'left' | 'right';
  customClasses?: {
    root?: string;
    track?: string;
    thumb?: string;
    label?: string;
  };
}

const sizeClasses: Record<
  SwitchSize,
  { track: string; thumb: string; translate: string; label: string }
> = {
  small: {
    track: 'w-8 h-[18px] rounded-full',
    thumb: 'w-3.5 h-3.5 rounded-full',
    translate: 'translate-x-[14px]',
    label: 'text-14',
  },
  middle: {
    track: 'w-10 h-[22px] rounded-full',
    thumb: 'w-[18px] h-[18px] rounded-full',
    translate: 'translate-x-[18px]',
    label: 'text-14',
  },
  large: {
    track: 'w-12 h-[26px] rounded-full',
    thumb: 'w-[22px] h-[22px] rounded-full',
    translate: 'translate-x-[22px]',
    label: 'text-16',
  },
};

const colorClasses: Record<SwitchColor, { active: string; inactive: string }> = {
  primary: {
    active: 'bg-primary',
    inactive: 'bg-neutral-border',
  },
  secondary: {
    active: 'bg-secondary',
    inactive: 'bg-neutral-border',
  },
  success: {
    active: 'bg-success',
    inactive: 'bg-neutral-border',
  },
  error: {
    active: 'bg-error',
    inactive: 'bg-neutral-border',
  },
  pending: {
    active: 'bg-pending',
    inactive: 'bg-neutral-border',
  },
  neutral: {
    active: 'bg-neutral-text-secondary',
    inactive: 'bg-neutral-border',
  },
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'middle',
  color = 'primary',
  label,
  labelPlacement = 'right',
  className,
  customClasses,
  id,
  ...rest
}) => {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  // Support both controlled and uncontrolled: use CSS `:checked` peer selector for uncontrolled,
  // and the `checked` prop for controlled rendering.
  const isControlled = checked !== undefined;

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer select-none',
        labelPlacement === 'left' && 'flex-row-reverse',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
        customClasses?.root,
      )}
      htmlFor={id}
    >
      <span className="relative inline-flex items-center">
        <input
          {...rest}
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={isControlled ? checked : undefined}
          className="peer sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
        />
        {/* Track */}
        <span
          className={cn(
            'block transition-colors duration-200',
            sizeClass.track,
            // Controlled: use JS; Uncontrolled: use peer-checked
            isControlled
              ? checked
                ? colorClass.active
                : colorClass.inactive
              : `${colorClass.inactive} peer-checked:${colorClass.active.replace('bg-', '!bg-')}`,
            // Focus ring on keyboard focus
            'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary-focus-ring',
            customClasses?.track,
          )}
          // For uncontrolled, apply active color via inline style fallback
          style={!isControlled ? { ['--switch-active' as string]: colorClass.active } : undefined}
        />
        {/* Thumb */}
        <span
          className={cn(
            'absolute left-[2px] top-1/2 -translate-y-1/2 bg-neutral-white shadow-sm transition-transform duration-200',
            sizeClass.thumb,
            isControlled
              ? checked
                ? sizeClass.translate
                : 'translate-x-0'
              : `translate-x-0 peer-checked:${sizeClass.translate}`,
            customClasses?.thumb,
          )}
        />
      </span>

      {label && (
        <span className={cn(sizeClass.label, 'font-medium', customClasses?.label)}>{label}</span>
      )}
    </label>
  );
};

Switch.displayName = 'Switch';

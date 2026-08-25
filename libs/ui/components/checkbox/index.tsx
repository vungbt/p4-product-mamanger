import type React from 'react';
import { cn } from '../../helpers/utils';
import { RenderIcon } from '../icons';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  indeterminate?: boolean;
  customClasses?: {
    root?: string;
    label?: string;
    box?: string;
    error?: string;
  };
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  const {
    label,
    className,
    size = 'middle',
    color = 'primary',
    indeterminate = false,
    customClasses,
    error,
    ...reset
  } = props;

  const isError = error && error.length > 0;
  const sizeClass = sizeClasses[size];
  const colorClass = isError ? colorClasses.error : colorClasses[color];
  const shouldShowIcon = indeterminate || reset?.checked || reset?.value;

  return (
    <label
      className={cn(
        'flex items-center cursor-pointer',
        reset.disabled && 'cursor-not-allowed opacity-50',
        className,
        customClasses?.root,
        sizeClass.root,
      )}
    >
      <input type="checkbox" className="peer hidden" {...reset} />
      <span
        className={cn(
          'relative inline-flex items-center justify-center border border-solid bg-neutral-white transition-all ease-linear',
          sizeClass.box,
          colorClass.box,
          customClasses?.box,
        )}
      >
        {shouldShowIcon && (
          <RenderIcon
            name={indeterminate ? 'minus' : 'check-v2'}
            strokeWidth={3}
            className={cn(sizeClass.icon, colorClass.icon)}
          />
        )}
      </span>

      {label && <span className={cn(sizeClass.label, customClasses?.label)}>{label}</span>}
    </label>
  );
};

const sizeClasses = {
  small: {
    root: 'gap-1',
    box: 'w-3 h-3 rounded',
    label: 'text-14 px-2',
    // !w-2 is too small relative to the box, making the check stroke thin/blurry — bumped up for a crisper look.
    icon: '!w-2.5 !h-2.5 max-w-2.5 max-h-2.5',
  },
  middle: {
    root: 'gap-1',
    box: 'w-[18px] h-[18px] rounded-[5px]', // per docs/design/p4-product-manager-design.html (Form controls · Checkbox)
    label: 'text-16 px-2',
    icon: '!w-3 !h-3 max-w-3 max-h-3',
  },
  large: {
    root: 'gap-1',
    box: 'w-5 h-5 rounded',
    label: 'text-16 px-2',
    icon: '!w-3.5 !h-3.5 max-w-3.5 max-h-3.5',
  },
};

const colorClasses = {
  primary: {
    box: 'peer-checked:border-primary peer-checked:bg-primary border-neutral',
    icon: 'text-white',
  },
  secondary: {
    box: 'peer-checked:border-secondary peer-checked:bg-secondary border-neutral',
    icon: 'text-white',
  },
  success: {
    box: 'peer-checked:border-success peer-checked:bg-success border-neutral',
    icon: 'text-white',
  },
  error: {
    box: 'peer-checked:border-error peer-checked:bg-error border-error',
    icon: 'text-white',
  },
  pending: {
    box: 'peer-checked:border-pending peer-checked:bg-pending border-neutral',
    icon: 'text-white',
  },
  neutral: {
    box: 'peer-checked:border-neutral peer-checked:bg-neutral border-neutral',
    icon: 'text-white',
  },
};

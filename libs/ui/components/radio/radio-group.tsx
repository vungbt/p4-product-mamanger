import type React from 'react';
import { cn } from '../../lib/utils';
import { Radio, type RadioProps } from './index';

export interface RadioOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  disabled?: boolean;
  className?: string;
  customClasses?: {
    root?: string;
    error?: string;
  };
  error?: string;
  size?: RadioProps['size'];
  color?: RadioProps['color'];
  optionType?: RadioProps['optionType'];
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  onBlur,
  name,
  size = 'middle',
  color,
  optionType,
  error,
  disabled,
  className,
  customClasses,
}) => {
  const colorClass = error ? 'error' : color;

  return (
    <div
      className={cn(
        className,
        customClasses?.root,
        error && customClasses?.error,
        'flex items-center gap-4',
      )}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          label={option.label}
          name={name}
          value={option.value}
          size={size}
          color={colorClass}
          optionType={optionType}
          checked={value === option.value}
          onChange={() => onChange?.(option.value)}
          onBlur={onBlur}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
};

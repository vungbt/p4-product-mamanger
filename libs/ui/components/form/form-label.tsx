import type React from 'react';
import { cn } from '../../lib/utils';

export const FormLabel = ({
  children,
  required,
  id,
  className,
  size,
}: {
  children: React.ReactNode;
  required?: boolean;
  id?: string;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}) => {
  const labelSizeClass = size === 'large' ? 'text-15' : size === 'small' ? 'text-13' : 'text-14';

  return (
    <label
      htmlFor={id ?? (children as React.ReactElement<{ id?: string }>)?.props?.id}
      className={cn(
        'block font-normal mb-1 w-fit leading-tight text-neutral-text-primary',
        labelSizeClass,
        className,
      )}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
};

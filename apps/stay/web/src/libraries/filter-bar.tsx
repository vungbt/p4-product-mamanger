import { Checkbox, type CheckboxProps, cn } from '@itclabs/react-ui';
import type { ComponentProps } from 'react';

/** Root class for a search field: two columns wide from `sm`. */
export const FILTER_WIDE = 'sm:col-span-2';

/**
 * Filter row of list screens: labelled kit fields in equal columns that wrap (stacked on
 * phones), aligned on their control line. Put toggles in `FilterCheckbox` so they line up too.
 */
export function FilterBar({ className, children, ...props }: ComponentProps<'fieldset'>) {
  return (
    <fieldset
      {...props}
      className={cn('grid min-w-0 grid-cols-filters items-end gap-3', className)}
    >
      <legend className="sr-only">Bộ lọc</legend>
      {children}
    </fieldset>
  );
}

/** A checkbox filter centred on the control line of the neighbouring fields. */
export function FilterCheckbox({ classNames, ...props }: CheckboxProps) {
  return (
    <Checkbox
      {...props}
      classNames={{
        ...classNames,
        root: cn('self-end', classNames?.root),
        row: cn('min-h-control-md', classNames?.row),
      }}
    />
  );
}

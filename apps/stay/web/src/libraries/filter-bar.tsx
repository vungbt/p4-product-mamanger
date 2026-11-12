import { Checkbox, type CheckboxProps, cn } from '@itclabs/react-ui';
import type { ComponentProps, ReactNode } from 'react';

/** Root class for a search field: two columns wide from `sm`. */
export const FILTER_WIDE = 'sm:col-span-2';

type FilterBarProps = ComponentProps<'fieldset'> & {
  /**
   * Page actions (create, import, export) shown right-aligned on the filter row from `xl`;
   * on narrower screens they follow the filters, full width on phones. They sit outside the
   * "Bộ lọc" group so specs can scope filter controls to that group.
   */
  actions?: ReactNode;
};

/**
 * Toolbar card of list screens (surface card above the table): labelled kit fields in equal columns that wrap (stacked on phones),
 * aligned on their control line, plus optional page `actions`. Put toggles in `FilterCheckbox`
 * so they line up too.
 */
export function FilterBar({ actions, className, children, ...props }: FilterBarProps) {
  const filters = children ? (
    <fieldset
      {...props}
      className={cn(
        'grid min-w-0 items-end gap-3',
        actions ? 'grid-cols-filters-compact' : 'grid-cols-filters',
        className,
      )}
    >
      <legend className="sr-only">Bộ lọc</legend>
      {children}
    </fieldset>
  ) : null;

  const actionRow = actions ? (
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end xl:ml-auto xl:shrink-0">
      {actions}
    </div>
  ) : null;

  // Actions alone (no filters): a plain right-aligned row above the list.
  if (!filters) return actionRow;

  return (
    <div
      className="flex min-w-0 flex-col gap-3 rounded-panel border border-line bg-surface p-4 xl:flex-row xl:items-end"
      data-testid="filter-card"
    >
      <div className="min-w-0 flex-1">{filters}</div>
      {actionRow}
    </div>
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

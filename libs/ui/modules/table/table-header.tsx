import { flexRender } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { RenderIcon } from '../../components/icons';
import { cn } from '../../helpers/utils';
import type { TableHeaderType } from '.';

type TableHeaderProps<T> = {
  headers: TableHeaderType<T>;
  className?: string;
  customClasses?: {
    root?: string;
    tr?: string;
    th?: string;
  };
};

export const TableHeader = <T extends Record<string, unknown>>({
  headers,
  className,
  customClasses,
}: TableHeaderProps<T>): ReactNode => {
  return (
    <thead
      className={cn('sticky top-0 bg-neutral-table-header z-[1]', className, customClasses?.root)}
    >
      {headers.map((headerGroup) => (
        <tr key={headerGroup.id} className={cn(customClasses?.tr)}>
          {headerGroup.headers.map((header) => {
            const columnDef = header?.column?.columnDef;
            const sortActive = header.column.getIsSorted() as 'asc' | 'desc';
            const showSort = columnDef?.enableSorting;
            const align = columnDef?.meta?.align ?? 'left';
            return (
              <th
                key={header.id}
                className={cn(
                  'px-[22px] py-3 text-ui-overline uppercase text-neutral-text-secondary select-none transition-all ease-linear hover:bg-primary-background border-b border-solid border-neutral-border',
                  align === 'right'
                    ? 'text-right'
                    : align === 'center'
                      ? 'text-center'
                      : 'text-left',
                  {
                    'cursor-pointer': showSort,
                    'bg-primary-background': sortActive,
                  },
                  customClasses?.th,
                )}
                style={{
                  width: header.column.columnDef.size,
                  maxWidth: header.column.columnDef.size,
                }}
                onClick={header.column.getToggleSortingHandler()}
              >
                <div
                  className={cn(
                    'flex items-center gap-1',
                    align === 'right'
                      ? 'justify-end'
                      : align === 'center'
                        ? 'justify-center'
                        : 'justify-between',
                  )}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {showSort && <SortAction active={sortActive} />}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};

const SortAction = ({ active }: { active: 'asc' | 'desc' }): ReactNode => {
  return (
    <div className="flex flex-col items-center justify-center w-fit">
      <span className="mb-[-2px]">
        <RenderIcon
          name="caret-up-fill"
          className={cn('!w-3 !h-3', { 'text-primary': active === 'asc' })}
        />
      </span>
      <span className="mt-[-2px]">
        <RenderIcon
          name="caret-down-fill"
          className={cn('!w-3 !h-3', { 'text-primary': active === 'desc' })}
        />
      </span>
    </div>
  );
};

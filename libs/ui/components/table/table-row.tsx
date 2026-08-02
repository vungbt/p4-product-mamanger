import { flexRender } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { TableRowType } from '.';

type TableRowProps<T> = {
  rows: TableRowType<T>;
  rowKey: string | number | symbol;
  selectedKeys?: React.Key[];
};

export const TableRow = <T extends Record<string, unknown>>({
  rows = [],
  rowKey,
  selectedKeys = [],
}: TableRowProps<T>): ReactNode => {
  return (
    <>
      {rows.map((row) => {
        const key = row.original[rowKey as string] as React.Key;
        const isSelected = selectedKeys.includes(key);

        return (
          <tr
            key={key}
            className={cn('transition-all ease-linear hover:bg-primary-background', {
              'bg-primary-background': isSelected,
              'even:bg-neutral-table-header': !isSelected,
            })}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="p-3 border-b border-neutral-divider text-14 h-14"
                style={{ width: cell.column.columnDef.size, maxWidth: cell.column.columnDef.size }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
};

export const TableRowEmpty = ({
  columnLength,
  height,
}: {
  columnLength: number;
  height: number;
}) => {
  return (
    <tr>
      <td colSpan={columnLength} style={{ height }} />
    </tr>
  );
};

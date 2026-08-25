import {
  type ColumnDef,
  getCoreRowModel,
  type HeaderGroup,
  type Row,
  type RowData,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { type ReactNode, useState } from 'react';
import { Checkbox } from '../../components/checkbox';
import { Pagination } from '../../components/pagination';
import { Radio } from '../../components/radio';
import { cn } from '../../helpers/utils';
import { TableEmpty } from './table-empty';
import { TableHeader } from './table-header';
import { TableLoading } from './table-loading';
import { TableRow, TableRowEmpty } from './table-row';

// Per docs/design/p4-product-manager-design.html (Data Display · Table): some column headers
// (Price/Stock/Actions) are right/center-aligned, not always left — let the consumer declare this via
// `meta.align` on each column instead of having to override `<th>` with customClasses (there's no way
// to target individual columns that way).
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
  }
}

type TableProps<T> = {
  columns: TableColumn<T>;
  data: T[];
  loading?: boolean;
  rowKey: keyof T;
  customClasses?: {
    root?: string;
  };

  // sorting
  sortable?: {
    sorting?: TableSortingType;
    onSorting?: (values: TableSortingType) => void;
  };

  // pagination
  pagination?: {
    total?: number;
    page?: number;
    pageCount?: number;
    limit?: number;
    onChangePage?: (value: number) => void;
  };

  // selection
  rowSelection?: {
    type: 'checkbox' | 'radio';
    selectedRowKeys?: React.Key[];
    onChange?: (selectedKeys: React.Key[], selectedRows: T[]) => void;
  };

  scroll?: {
    y?: number;
    x?: number;
  };
};

export const Table = <T extends Record<string, unknown>>({
  columns = [],
  data = [],
  loading = false,
  rowKey,
  customClasses = { root: '' },

  sortable = { sorting: [], onSorting: Function.prototype as () => void },

  pagination = {
    total: 0,
    page: 1,
    limit: 10,
    pageCount: 0,
    onChangePage: Function.prototype as () => void,
  },

  rowSelection,

  scroll,
}: TableProps<T>): ReactNode => {
  const { sorting, onSorting } = sortable;
  const { total = 0, page = 1, pageCount: totalPage = 0, limit = 10, onChangePage } = pagination;
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<React.Key[]>([]);
  const selectedKeys = rowSelection?.selectedRowKeys ?? internalSelectedKeys;

  const handleSelect = (key: React.Key, _: T) => {
    let newSelected: React.Key[] = [];

    if (rowSelection?.type === 'radio') {
      newSelected = [key];
    } else {
      if (selectedKeys.includes(key)) {
        newSelected = selectedKeys.filter((k) => k !== key);
      } else {
        newSelected = [...selectedKeys, key];
      }
    }

    if (!rowSelection?.selectedRowKeys) {
      setInternalSelectedKeys(newSelected);
    }

    rowSelection?.onChange?.(
      newSelected,
      data.filter((d) => newSelected.includes(d[rowKey] as React.Key)),
    );
  };

  const selectionColumn: ColumnDef<T> = {
    id: '__selection__',
    header: () =>
      rowSelection?.type === 'checkbox' ? (
        <Checkbox
          indeterminate={
            rows.length > 0 && selectedKeys.length > 0 && selectedKeys.length < rows.length
          }
          checked={
            (rows.length > 0 &&
              rows.every((row) => selectedKeys.includes(row.original[rowKey] as React.Key))) ||
            (rows.length > 0 && selectedKeys.length > 0 && selectedKeys.length < rows.length)
          }
          onChange={(e) => {
            const allKeys = (e.target as HTMLInputElement).checked
              ? rows.map((r) => r.original[rowKey] as React.Key)
              : [];
            if (!rowSelection?.selectedRowKeys) {
              setInternalSelectedKeys(allKeys);
            }
            rowSelection?.onChange?.(
              allKeys,
              data.filter((d) => allKeys.includes(d[rowKey] as React.Key)),
            );
          }}
        />
      ) : null,
    cell: ({ row }) => {
      const key = row.original[rowKey] as React.Key;
      const isSelected = selectedKeys.includes(key);
      if (rowSelection?.type === 'checkbox')
        return (
          <span className="flex items-center justify-center w-fit h-fit">
            <Checkbox checked={isSelected} onChange={() => handleSelect(key, row.original)} />
          </span>
        );
      return (
        <span className="flex items-center justify-center w-fit h-fit">
          <Radio checked={isSelected} onChange={() => handleSelect(key, row.original)} />
        </span>
      );
    },
    size: 0,
    minSize: 0,
  };
  const allColumns = rowSelection ? [selectionColumn, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting },
    onSortingChange: (values) => onSorting?.(values as TableSortingType),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: undefined,
    manualPagination: true,
    manualSorting: true,
  });

  const pageCount = totalPage || Math.ceil(total / limit);
  const rows = table.getRowModel().rows;
  const missingRows = limit && rows.length < limit ? limit - rows.length : 0;

  return (
    <div className={cn('w-full bg-neutral-white', customClasses.root)}>
      <div className={cn('overflow-y-auto h-full', scroll?.y && `max-h-[${scroll?.y}px]`)}>
        <table className="min-w-full table-auto h-full">
          <TableHeader headers={table.getHeaderGroups() as TableHeaderType<T>} />
          <tbody className="relative">
            {rows.length > 0 ? (
              <>
                <TableRow rows={rows} rowKey={rowKey} selectedKeys={selectedKeys} />
                {missingRows > 0 && (
                  <TableRowEmpty
                    columnLength={columns.length}
                    height={scroll?.y || missingRows * 56}
                  />
                )}
              </>
            ) : (
              <TableEmpty columnLength={columns.length} height={scroll?.y || limit * 56} />
            )}

            {loading && <TableLoading />}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && onChangePage && (
        <div className="mt-4 w-full flex items-center justify-end">
          <Pagination
            pageCount={pageCount}
            page={page}
            total={total}
            limit={limit}
            onChangePage={onChangePage}
          />
        </div>
      )}
    </div>
  );
};

export type TableColumn<T> = ColumnDef<T>[];
export type TableRowType<T> = Row<T>[];
export type TableHeaderType<T> = HeaderGroup<T>[];
export type TableSortingType = SortingState;

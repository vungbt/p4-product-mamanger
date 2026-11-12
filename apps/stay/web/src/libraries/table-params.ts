import type { DataTableState } from '@itclabs/react-ui';
import { useSearchParams } from 'react-router-dom';
import { latestSearchParams } from './search-params';

/** Page sizes offered by list tables (the API accepts up to 100). */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type SortOrder = 'asc' | 'desc';

type Sort<S extends string> = { sortBy: S; sortOrder: SortOrder };

type Options<S extends string> = {
  /** Fields the list endpoint accepts as `sortBy`; DataTable column ids use the same names. */
  sortFields: readonly S[];
  /** The API's default order, kept off the URL. */
  defaultSort: Sort<S>;
  defaultPageSize?: number;
};

function isPageSize(value: number): boolean {
  return PAGE_SIZE_OPTIONS.some((size) => size === value);
}

/**
 * Server-side paging and sorting of a DataTable, kept on the URL (`page`, `pageSize`, `sortBy`,
 * `sortOrder`); defaults stay off the URL. Filters reset `page` themselves.
 */
export function useTableParams<S extends string>({
  sortFields,
  defaultSort,
  defaultPageSize = 20,
}: Options<S>) {
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get('page')) || 1);
  const sizeParam = Number(params.get('pageSize'));
  const pageSize = isPageSize(sizeParam) ? sizeParam : defaultPageSize;
  const urlSort = sortFields.find((field) => field === params.get('sortBy'));
  const urlOrder = params.get('sortOrder');
  const sort: Sort<S> = urlSort
    ? { sortBy: urlSort, sortOrder: urlOrder === 'desc' ? 'desc' : 'asc' }
    : defaultSort;

  const state: DataTableState = {
    sorting: [{ id: sort.sortBy, desc: sort.sortOrder === 'desc' }],
    pagination: { pageIndex: page - 1, pageSize },
  };

  /** Writes a sort (the default one clears the URL) and returns to page 1. */
  const setSort = (next: Sort<S>) =>
    setParams(
      () => {
        const url = latestSearchParams();
        const isDefault =
          next.sortBy === defaultSort.sortBy && next.sortOrder === defaultSort.sortOrder;

        if (isDefault) {
          url.delete('sortBy');
          url.delete('sortOrder');
        } else {
          url.set('sortBy', next.sortBy);
          url.set('sortOrder', next.sortOrder);
        }
        url.delete('page');
        return url;
      },
      { replace: true },
    );

  const onStateChange = (next: DataTableState) => {
    const column = next.sorting[0];
    const field = sortFields.find((value) => value === column?.id);
    // Server lists always have an order: removing the sort flips the current column instead.
    const nextSort: Sort<S> = field
      ? { sortBy: field, sortOrder: column?.desc ? 'desc' : 'asc' }
      : { sortBy: sort.sortBy, sortOrder: sort.sortOrder === 'asc' ? 'desc' : 'asc' };
    const sortChanged = nextSort.sortBy !== sort.sortBy || nextSort.sortOrder !== sort.sortOrder;

    if (sortChanged) {
      setSort(nextSort);
      return;
    }
    setParams(
      () => {
        const url = latestSearchParams();
        const nextPage = next.pagination.pageIndex + 1;
        const nextSize = next.pagination.pageSize;

        if (nextPage > 1) url.set('page', String(nextPage));
        else url.delete('page');
        if (nextSize !== defaultPageSize && isPageSize(nextSize))
          url.set('pageSize', String(nextSize));
        else url.delete('pageSize');
        return url;
      },
      { replace: true },
    );
  };

  return { page, pageSize, ...sort, state, onStateChange, setSort };
}

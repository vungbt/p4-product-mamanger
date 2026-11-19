import { type DataTableState, useDebouncedCallback } from '@itclabs/react-ui';
import { useProducts } from '@p4/api-sdk/react';
import { getErrorMessage, type ProductListQuery } from '@p4/api-sdk/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from '@/constants/list';
import useQueryParam from '@/hooks/use-query-param';
import { PRODUCT_STATUSES } from '@/modules/admin/products/components/product-status';

const sortFields: NonNullable<ProductListQuery['sortBy']>[] = [
  'name',
  'price',
  'stock',
  'createdAt',
];

const productQuerySchema = v.object({
  page: v.optional(
    v.fallback(
      v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1), v.maxValue(100_000)),
      1,
    ),
    '1',
  ),
  pageSize: v.optional(
    v.fallback(
      v.pipe(
        v.string(),
        v.transform(Number),
        v.check((value) => PAGE_SIZE_OPTIONS.some((size) => size === value)),
      ),
      DEFAULT_PAGE_SIZE,
    ),
    String(DEFAULT_PAGE_SIZE),
  ),
  q: v.optional(v.fallback(v.pipe(v.string(), v.trim()), '')),
  status: v.fallback(v.optional(v.picklist(PRODUCT_STATUSES)), undefined),
  categoryId: v.fallback(v.optional(v.pipe(v.string(), v.uuid())), undefined),
  availability: v.fallback(v.optional(v.picklist(['in_stock', 'out_of_stock'])), undefined),
  sortBy: v.optional(v.fallback(v.picklist(sortFields), 'createdAt'), 'createdAt'),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'desc'), 'desc'),
});

export default function useProductsPage() {
  const { t } = useTranslation();

  const [params, setQuery] = useQueryParam(productQuerySchema);

  const { page, pageSize, sortBy, sortOrder, status, categoryId, availability } = params;
  const globalFilter = params.q ?? '';

  const [columnVisibility, setColumnVisibility] = useState<DataTableState['columnVisibility']>({});

  const [search, setSearch] = useState(globalFilter);

  const state: DataTableState = {
    sorting: [{ id: sortBy, desc: sortOrder === 'desc' }],
    pagination: { pageIndex: page - 1, pageSize },
    globalFilter,
    columnFilters: [],
    columnVisibility,
  };

  const query = useProducts({
    page,
    pageSize,
    q: globalFilter || undefined,
    status,
    categoryId,
    availability,
    sortBy,
    sortOrder,
  });

  const applySearch = (value: string) => setQuery({ q: value, page: 1 }, { replace: true });

  const debouncedSearch = useDebouncedCallback(applySearch, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    debouncedSearch.cancel();
    setSearch(globalFilter);
  }, [globalFilter, debouncedSearch]);

  const changeTableState = (next: DataTableState) => {
    setColumnVisibility(next.columnVisibility);

    const sorting = next.sorting[0];
    const nextSortBy = sortFields.find((field) => field === sorting?.id) ?? 'createdAt';
    const nextSortOrder = sorting?.desc === false ? 'asc' : 'desc';

    const sortChanged = nextSortBy !== sortBy || nextSortOrder !== sortOrder;
    const sizeChanged = next.pagination.pageSize !== pageSize;

    if (!sortChanged && !sizeChanged && next.pagination.pageIndex === page - 1) return;

    setQuery({
      page: sortChanged || sizeChanged ? 1 : next.pagination.pageIndex + 1,
      pageSize: next.pagination.pageSize,
      sortBy: nextSortBy,
      sortOrder: nextSortOrder,
    });
  };

  const changeSearch = (value: string) => {
    setSearch(value);

    if (value.trim()) debouncedSearch(value.trim());
    else {
      debouncedSearch.cancel();
      applySearch('');
    }
  };

  const clearSearch = () => {
    debouncedSearch.cancel();
    setSearch('');
    applySearch('');
  };

  const hasAppliedFilters = Boolean(globalFilter || status || categoryId || availability);
  const hasFilters = Boolean(search || hasAppliedFilters);

  const resetFilters = () => {
    debouncedSearch.cancel();
    setSearch('');
    setQuery({
      q: undefined,
      status: undefined,
      categoryId: undefined,
      availability: undefined,
      page: 1,
    });
  };

  const resetOrRefresh = () => {
    if (hasFilters) resetFilters();
    else if (!query.isFetching) void query.refetch();
  };

  const changeFilter = (
    patch: Partial<Pick<typeof params, 'status' | 'categoryId' | 'availability'>>,
  ) => setQuery({ ...patch, page: 1 });

  const changeColumnVisibility = (id: string, checked: boolean) =>
    setColumnVisibility((previous) => ({ ...previous, [id]: checked }));

  return {
    rows: query.data?.data ?? [],
    rowCount: query.data?.meta?.total ?? 0,
    state,
    search,
    filters: { status, categoryId, availability },
    hasFilters,
    hasAppliedFilters,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error: query.isError ? getErrorMessage(query.error, t('adminProducts.loadFailed')) : undefined,
    changeTableState,
    changeSearch,
    clearSearch,
    changeFilter,
    resetOrRefresh,
    changeColumnVisibility,
    refetch: () => {
      void query.refetch();
    },
  };
}

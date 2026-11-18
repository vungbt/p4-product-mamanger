import { type DataTableState, useDebouncedCallback } from '@itclabs/react-ui';
import { useProducts } from '@p4/api-sdk/react';
import { getErrorMessage, type ProductListQuery } from '@p4/api-sdk/shared';
import type { Product } from '@p4/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import useQueryParam from '@/hooks/use-query-param';

const sortFields: NonNullable<ProductListQuery['sortBy']>[] = [
  'name',
  'price',
  'createdAt',
  'stock',
];

const productQuerySchema = v.object({
  page: v.optional(
    v.fallback(
      v.pipe(
        v.string(),
        v.transform(Number),
        v.safeInteger(),
        v.minValue(1),
        v.maxValue(Math.floor(Number.MAX_SAFE_INTEGER / 50)),
      ),
      1,
    ),
    '1',
  ),
  pageSize: v.optional(
    v.fallback(
      v.pipe(
        v.string(),
        v.transform(Number),
        v.check((value) => [10, 20, 50].includes(value)),
      ),
      10,
    ),
    '10',
  ),
  q: v.optional(v.fallback(v.pipe(v.string(), v.trim()), '')),
  categoryId: v.optional(v.fallback(v.pipe(v.string(), v.trim()), '')),
  sortBy: v.fallback(v.optional(v.pipe(v.string(), v.trim(), v.picklist(sortFields))), undefined),
  sortOrder: v.fallback(
    v.optional(v.pipe(v.string(), v.trim(), v.toLowerCase(), v.picklist(['asc', 'desc']))),
    undefined,
  ),
});

export default function useProductsPage() {
  const { t } = useTranslation();
  const [params, setQuery] = useQueryParam(productQuerySchema);
  const { page, pageSize, sortBy } = params;
  const sortOrder = sortBy ? (params.sortOrder ?? 'desc') : undefined;
  const globalFilter = params.q ?? '';
  const categoryFilter = params.categoryId || undefined;
  const [columnVisibility, setColumnVisibility] = useState<DataTableState['columnVisibility']>({});
  const [search, setSearch] = useState(globalFilter);
  const [viewing, setViewing] = useState<string | null>(null);

  const state: DataTableState = {
    sorting: sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [],
    pagination: { pageIndex: page - 1, pageSize },
    globalFilter,
    columnFilters: categoryFilter ? [{ id: 'categoryId', value: categoryFilter }] : [],
    columnVisibility,
  };

  const query = useProducts({
    page,
    pageSize,
    q: globalFilter || undefined,
    categoryId: categoryFilter,
    sortBy: sortBy ?? 'createdAt',
    sortOrder: sortOrder ?? 'desc',
  });

  const changeTableState = (next: DataTableState) => {
    setColumnVisibility(next.columnVisibility);

    const sorting = next.sorting[0];
    const nextSortBy = sortFields.find((field) => field === sorting?.id);

    const pageIndexChanged = next.pagination.pageIndex !== state.pagination.pageIndex;
    const pageSizeChanged = next.pagination.pageSize !== pageSize;
    const sortChanged =
      nextSortBy !== sortBy ||
      (nextSortBy ? Boolean(sorting?.desc) !== (sortOrder === 'desc') : false);

    if (!pageIndexChanged && !pageSizeChanged && !sortChanged) {
      return;
    }

    const resetPage = pageSizeChanged || sortChanged;

    setQuery({
      page: resetPage ? 1 : next.pagination.pageIndex + 1,
      pageSize: next.pagination.pageSize,
      sortBy: nextSortBy,
      sortOrder: nextSortBy ? (sorting?.desc ? 'desc' : 'asc') : undefined,
    });
  };

  const applySearch = (value: string) => setQuery({ q: value, page: 1 }, { replace: true });
  const debouncedSearch = useDebouncedCallback(applySearch, 300);

  const clearSearch = () => {
    debouncedSearch.cancel();
    setSearch('');
    applySearch('');
  };

  useEffect(() => {
    debouncedSearch.cancel();
    setSearch(globalFilter);
  }, [globalFilter, debouncedSearch]);

  const resetFilters = () => {
    debouncedSearch.cancel();
    setSearch('');
    setQuery({ q: undefined, categoryId: undefined, page: 1 });
  };

  const rows = query.data?.data ?? [];
  const rowCount = query.data?.meta?.total ?? 0;

  const hasAppliedFilters = Boolean(state.globalFilter || state.columnFilters?.length);
  const hasFilters = Boolean(search || hasAppliedFilters);

  const resetOrRefresh = () => {
    if (hasFilters) resetFilters();
    else if (!query.isFetching) void query.refetch();
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) debouncedSearch(value.trim());
    else {
      debouncedSearch.cancel();
      applySearch('');
    }
  };

  const changeCategoryFilter = (categoryId: string | null) => {
    setQuery({ categoryId: categoryId || undefined, page: 1 });
  };

  const changeColumnVisibility = (id: string, checked: boolean) =>
    setColumnVisibility((previous) => ({ ...previous, [id]: checked }));

  const openDetails = (product: Product) => setViewing(product.id);
  const closeDetails = () => setViewing(null);

  return {
    rows,
    rowCount,
    state,
    search,
    categoryFilter,
    hasFilters,
    hasAppliedFilters,
    viewing,
    loading: query.isPending,
    error: query.isError
      ? getErrorMessage(query.error, t('products.loadFailed', 'Không thể tải danh sách sản phẩm.'))
      : undefined,
    changeTableState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeCategoryFilter,
    changeColumnVisibility,
    openDetails,
    closeDetails,
    retry: () => {
      void query.refetch();
    },
  };
}

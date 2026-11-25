import { type DataTableState, useDebouncedCallback } from '@itclabs/react-ui';
import { keepPreviousData, useGetAdminVariants, useGetShopConfig } from '@p4/api-sdk/react';
import { getErrorMessage, type operations } from '@p4/api-sdk/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from '@/constants/list';
import useQueryParam from '@/hooks/use-query-param';

type AdminVariantsQuery = NonNullable<operations['get_api_admin_variants']['parameters']['query']>;

export const sortFields: NonNullable<AdminVariantsQuery['sortBy']>[] = [
  'sku',
  'price',
  'onHand',
  'createdAt',
];

export type SortField = (typeof sortFields)[number];

export const variantQuerySchema = v.object({
  page: v.optional(
    v.fallback(v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)), 1),
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
  q: v.optional(v.fallback(v.pipe(v.string(), v.maxLength(255)), '')),
  status: v.fallback(v.optional(v.picklist(['active', 'inactive'])), undefined),
  sortBy: v.optional(v.fallback(v.picklist(sortFields), 'createdAt'), 'createdAt'),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'desc'), 'desc'),
});

export default function useVariantsPage() {
  const { t } = useTranslation();

  const [params, setQuery] = useQueryParam(variantQuerySchema);

  const { page, pageSize, sortBy, sortOrder, status } = params;
  const globalFilter = params.q ?? '';

  const [search, setSearch] = useState(globalFilter);

  const shopConfig = useGetShopConfig();
  const currency = shopConfig.data?.data?.currency ?? 'VND';

  const state: DataTableState = {
    sorting: [{ id: sortBy, desc: sortOrder === 'desc' }],
    pagination: { pageIndex: page - 1, pageSize },
  };

  const query = useGetAdminVariants(
    {
      params: {
        query: {
          page,
          pageSize,
          q: globalFilter.trim() || undefined,
          status,
          sortBy,
          sortOrder,
        },
      },
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const applySearch = (val: string) => {
    setQuery({ q: val.trim() || undefined, page: 1 }, { replace: true });
  };

  const debouncedSearch = useDebouncedCallback(applySearch, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    debouncedSearch.cancel();
    setSearch(globalFilter);
  }, [globalFilter, debouncedSearch]);

  const changeSearch = (value: string) => {
    setSearch(value);

    if (value.trim()) debouncedSearch(value);
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

  const changeStatus = (newStatus: 'all' | 'active' | 'inactive') => {
    setQuery({
      status: newStatus === 'all' ? undefined : newStatus,
      page: 1,
    });
  };

  const changeTableState = (next: DataTableState) => {
    const sorting = next.sorting[0];
    const nextSortBy = sorting
      ? (sortFields.find((f) => f === sorting.id) ?? 'createdAt')
      : 'createdAt';
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

  const refresh = () => {
    void query.refetch();
  };

  return {
    rows: query.data?.data ?? [],
    rowCount: query.data?.meta?.total ?? 0,
    state,
    search,
    currency,
    status,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error: query.isError
      ? getErrorMessage(query.error, t('adminProducts.variantsFailed'))
      : undefined,
    changeSearch,
    clearSearch,
    changeStatus,
    changeTableState,
    refresh,
  };
}

import { type DataTableState, useDebouncedCallback } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@p4/api-sdk/react';
import { type CategoryListQuery, getErrorMessage } from '@p4/api-sdk/shared';
import { type Category, type CategoryInput, DESCRIPTION_FILTER_VALUES } from '@p4/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import useQueryParam from '@/hooks/use-query-param';

const sortFields: NonNullable<CategoryListQuery['sortBy']>[] = ['name', 'slug', 'description'];

const categoryQuerySchema = v.object({
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
  description: v.optional(v.fallback(v.picklist(DESCRIPTION_FILTER_VALUES), 'all')),
  sortBy: v.optional(v.fallback(v.picklist(sortFields), 'name')),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'asc'), 'asc'),
});

export default function useCategoryPage() {
  const { t } = useTranslation();

  const [params, setQuery] = useQueryParam(categoryQuerySchema);

  const { page, pageSize, sortBy } = params;
  const sortOrder = sortBy ? params.sortOrder : 'asc';
  const globalFilter = params.q ?? '';
  const descriptionFilter = params.description === 'all' ? undefined : params.description;

  const [columnVisibility, setColumnVisibility] = useState<DataTableState['columnVisibility']>({});
  const [search, setSearch] = useState(globalFilter);
  const [viewing, setViewing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [editor, setEditor] = useState<(CategoryInput & { id?: string }) | null>(null);

  const state: DataTableState = {
    sorting: sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [],
    pagination: { pageIndex: page - 1, pageSize },
    globalFilter,
    columnFilters: descriptionFilter ? [{ id: 'description', value: descriptionFilter }] : [],
    columnVisibility,
  };

  const query = useCategories({
    page,
    pageSize,
    q: globalFilter || undefined,
    description: descriptionFilter,
    sortBy: sortBy ?? 'name',
    sortOrder,
  });

  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const changeTableState = (next: DataTableState) => {
    setColumnVisibility(next.columnVisibility);

    const sorting = next.sorting[0];
    const nextSortBy = sortFields.find((field) => field === sorting?.id);

    if (
      nextSortBy === sortBy &&
      Boolean(sorting?.desc) === (sortOrder === 'desc') &&
      next.pagination.pageIndex === state.pagination.pageIndex &&
      next.pagination.pageSize === pageSize
    )
      return;

    const resetPage =
      next.pagination.pageSize !== pageSize ||
      nextSortBy !== sortBy ||
      Boolean(sorting?.desc) !== (sortOrder === 'desc');

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
    setQuery({ q: undefined, description: undefined, page: 1 });
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

  const changeDescriptionFilter = (value: string | null) => {
    const filter = DESCRIPTION_FILTER_VALUES.find((option) => option === value) ?? 'all';

    setQuery({ description: filter === 'all' ? undefined : filter, page: 1 });
  };

  const changeColumnVisibility = (id: string, checked: boolean) =>
    setColumnVisibility((previous) => ({ ...previous, [id]: checked }));

  const openCreate = () => setEditor({ name: '', slug: '', description: '' });

  const openDetails = (category: Category) => setViewing(category.id);

  const closeDetails = () => setViewing(null);

  const closeEditor = () => {
    if (!create.isPending && !update.isPending) setEditor(null);
  };

  const closeDelete = () => {
    if (!remove.isPending) setDeleting(null);
  };

  const saveCategory = async (body: CategoryInput) => {
    if (!editor) return;
    if (editor.id) await update.mutateAsync({ id: editor.id, body });
    else await create.mutateAsync(body);
    toast.success(t(editor.id ? 'categories.updated' : 'categories.created'));
    resetFilters();
    setEditor(null);
  };

  const deleteCategory = async () => {
    if (!deleting || remove.isPending) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(t('categories.deleted'));
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t('categories.deleteFailed')));
    }
  };

  return {
    rows,
    rowCount,
    state,
    search,
    descriptionFilter,
    hasFilters,
    hasAppliedFilters,
    viewing,
    deleting,
    editor,
    loading: query.isPending || query.isFetching,
    error: query.isError ? getErrorMessage(query.error, t('categories.loadFailed')) : undefined,
    saving: create.isPending || update.isPending,
    deletingPending: remove.isPending,
    changeTableState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeDescriptionFilter,
    changeColumnVisibility,
    openCreate,
    openDetails,
    closeDetails,
    openEdit: setEditor,
    closeEditor,
    openDelete: setDeleting,
    closeDelete,
    saveCategory,
    deleteCategory,
    retry: () => {
      void query.refetch();
    },
  };
}

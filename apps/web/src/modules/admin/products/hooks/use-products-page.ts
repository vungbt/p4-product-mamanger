import { type DataTableState, toast, useDebouncedCallback } from '@itclabs/react-ui';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
  useUpdateProductPublication,
} from '@p4/api-sdk/react';
import { getErrorMessage, type ProductInput, type ProductListQuery } from '@p4/api-sdk/shared';
import type { Product } from '@p4/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';
import useQueryParam from '@/hooks/use-query-param';

const sortFields: NonNullable<ProductListQuery['sortBy']>[] = ['name', 'price', 'createdAt'];

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
  sortBy: v.optional(v.fallback(v.picklist(sortFields), 'createdAt')),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'desc'), 'desc'),
});

export default function useProductsPage() {
  const { t } = useTranslation();
  const [params, setQuery] = useQueryParam(productQuerySchema);
  const { page, pageSize, sortBy } = params;
  const sortOrder = sortBy ? params.sortOrder : 'desc';
  const globalFilter = params.q ?? '';
  const categoryFilter = params.categoryId || undefined;
  const [columnVisibility, setColumnVisibility] = useState<DataTableState['columnVisibility']>({});
  const [search, setSearch] = useState(globalFilter);
  const [viewing, setViewing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [editor, setEditor] = useState<(ProductInput & { id?: string }) | null>(null);

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
    sortOrder,
  });

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const updatePublication = useUpdateProductPublication();

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
      sortOrder: nextSortBy ? (sorting.desc ? 'desc' : 'asc') : undefined,
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
    else if (query.isFetching) void query.refetch();
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
  const openCreate = () => setEditor({ name: '', slug: '', description: '', price: 0, stock: 0 });

  const openDetails = (products: Product) => setViewing(products.id);
  const closeDetails = () => setViewing(null);

  const closeEditor = () => setEditor(null);

  const closeDelete = () => {
    if (!remove.isPending) setDeleting(null);
  };
  const deleteProduct = async () => {
    if (!deleting || remove.isPending) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(t('products.deleted', 'Đã xóa sản phẩm.'));
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t('products.deleteFailed', 'Không thể xóa sản phẩm.')));
    }
  };

  const openEdit = (product: Product) => {
    setEditor({
      id: product.id,
      name: product.name,
      slug: (product as any).slug ?? '',
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId || undefined,
      imageStorageId: product.imageUrl,
    });
  };
  const saveProduct = async (input: ProductInput & { id?: string }) => {
    try {
      const payload: ProductInput = {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        stock: input.stock,
        categoryId: input.categoryId || undefined,
        imageStorageId: input.imageStorageId,
      };
      if (input.id) {
        await update.mutateAsync({ id: input.id, body: payload });
        toast.success(t('products.updated', 'Đã cập nhật sản phẩm.'));
      } else {
        await create.mutateAsync(payload);
        toast.success(t('products.created', 'Đã tạo sản phẩm thành công.'));
      }
      setEditor(null);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          input.id
            ? t('products.updateFailed', 'Không thể cập nhật sản phẩm.')
            : t('products.createFailed', 'Không thể tạo sản phẩm.'),
        ),
      );
    }
  };
  const changePublication = async (
    id: string,
    status: 'draft' | 'active' | 'inactive' | 'archived',
    expectedVersion = 1,
  ) => {
    try {
      await updatePublication.mutateAsync({ id, body: { status, expectedVersion } });
      toast.success(t('products.statusUpdated', 'Đã cập nhật trạng thái sản phẩm.'));
    } catch (error) {
      toast.error(
        getErrorMessage(error, t('products.statusUpdateFailed', 'Không thể đổi trạng thái.')),
      );
    }
  };

  return {
    rows,
    rowCount,
    state,
    search,
    categoryFilter,
    hasFilters,
    hasAppliedFilters,
    viewing,
    deleting,
    editor,
    loading: query.isPending || query.isFetching,
    error: query.isError
      ? getErrorMessage(query.error, t('products.loadFailed', 'Không thể tải danh sách sản phẩm.'))
      : undefined,
    saving: create.isPending || update.isPending || updatePublication.isPending,
    deletingPending: remove.isPending,
    changeTableState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeCategoryFilter,
    changeColumnVisibility,
    openCreate,
    openDetails,
    closeDetails,
    openEdit,
    closeEditor,
    openDelete: setDeleting,
    closeDelete,
    deleteProduct,
    changePublication,
    saveProduct,
    retry: () => {
      void query.refetch();
    },
  };
}

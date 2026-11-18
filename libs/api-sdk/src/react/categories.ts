import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type CategoryListQuery, createCategoryApi } from '../shared/categories.js';
import type { ApiSdk } from '../shared/client.js';
import { useApiSdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const categoryKeys = {
  all: key('categories'),
  lists: () => key('categories', 'list'),
  list: (query?: CategoryListQuery) => key('categories', 'list', query ?? {}),
  details: () => key('categories', 'detail'),
  detail: (id: string) => key('categories', 'detail', id),
  allList: () => key('categories', 'all-list'),
};

export function categoryQueryOptions(sdk: ApiSdk) {
  const api = createCategoryApi(sdk);

  return {
    list: (query?: CategoryListQuery) =>
      queryOptions({
        queryKey: categoryKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
      }),
    all: () =>
      queryOptions({
        queryKey: categoryKeys.allList(),
        queryFn: async ({ signal }) => {
          const res1 = await api.list({ page: 1, pageSize: 100 }, signal);
          const totalPages = res1.meta?.totalPages ?? 1;
          if (totalPages <= 1) return res1.data;
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              api.list({ page: i + 2, pageSize: 100 }, signal),
            ),
          );
          return [...res1.data, ...rest.flatMap((r) => r.data)];
        },
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: categoryKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function categoryMutationOptions(sdk: ApiSdk, client: QueryClient) {
  const api = createCategoryApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: categoryKeys.all });

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    remove: () => mutationOptions({ mutationFn: api.remove, retry: false, onSuccess: refresh }),
  };
}

export function useCategories(query?: CategoryListQuery) {
  const sdk = useApiSdk();

  return useQuery(categoryQueryOptions(sdk).list(query));
}

export function useCategory(id: string) {
  const sdk = useApiSdk();

  return useQuery(categoryQueryOptions(sdk).detail(id));
}

export function useCreateCategory() {
  const sdk = useApiSdk();
  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client).create());
}

export function useUpdateCategory() {
  const sdk = useApiSdk();
  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client).update());
}

export function useDeleteCategory() {
  const sdk = useApiSdk();
  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client).remove());
}

export function useAllCategories() {
  const sdk = useApiSdk();

  return useQuery(categoryQueryOptions(sdk).all());
}

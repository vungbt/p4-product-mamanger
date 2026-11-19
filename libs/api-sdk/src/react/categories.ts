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
import { type ApiMutationSettings, resourceInvalidationKeys } from './resources.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const categoryKeys = {
  all: key('categories'),
  lists: () => key('categories', 'list'),
  list: (query?: CategoryListQuery) => key('categories', 'list', query ?? {}),
  details: () => key('categories', 'detail'),
  detail: (id: string) => key('categories', 'detail', id),
};

export function categoryQueryOptions(sdk: ApiSdk) {
  const api = createCategoryApi(sdk);

  return {
    list: (query?: CategoryListQuery) =>
      queryOptions({
        queryKey: categoryKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: categoryKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function categoryMutationOptions(
  sdk: ApiSdk,
  client: QueryClient,
  settings?: ApiMutationSettings,
) {
  const api = createCategoryApi(sdk);

  const refresh = () =>
    Promise.all(
      (settings?.invalidate ?? resourceInvalidationKeys.categories ?? []).map((queryKey) =>
        client.invalidateQueries({ queryKey }),
      ),
    );

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

export function useCreateCategory(settings?: ApiMutationSettings) {
  const sdk = useApiSdk();

  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client, settings).create());
}

export function useUpdateCategory(settings?: ApiMutationSettings) {
  const sdk = useApiSdk();

  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client, settings).update());
}

export function useDeleteCategory(settings?: ApiMutationSettings) {
  const sdk = useApiSdk();

  const client = useQueryClient();

  return useMutation(categoryMutationOptions(sdk, client, settings).remove());
}

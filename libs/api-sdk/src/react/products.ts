import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiSdk } from '../shared/client.js';
import { createProductApi, type ProductListQuery } from '../shared/products.js';
import { useApiSdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const productKeys = {
  all: key('products'),
  lists: () => key('products', 'list'),
  list: (query?: ProductListQuery) => key('products', 'list', query ?? {}),
  details: () => key('products', 'detail'),
  detail: (id: string) => key('products', 'detail', id),
  variants: (id: string) => key('products', 'variants', id),
};

export function productQueryOptions(sdk: ApiSdk) {
  const api = createProductApi(sdk);

  return {
    list: (query?: ProductListQuery) =>
      queryOptions({
        queryKey: productKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: productKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
    variants: (id: string) =>
      queryOptions({
        queryKey: productKeys.variants(id),
        queryFn: ({ signal }) => api.variants(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function productMutationOptions(sdk: ApiSdk, client: QueryClient) {
  const api = createProductApi(sdk);
  const refresh = () =>
    client.invalidateQueries({
      queryKey: productKeys.all,
    });
  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    remove: () => mutationOptions({ mutationFn: api.remove, retry: false, onSuccess: refresh }),
    updatePublication: () =>
      mutationOptions({ mutationFn: api.updatePublication, retry: false, onSuccess: refresh }),
  };
}

export function useProducts(query?: ProductListQuery) {
  const sdk = useApiSdk();
  return useQuery(productQueryOptions(sdk).list(query));
}

export function useProduct(id: string) {
  const sdk = useApiSdk();
  return useQuery(productQueryOptions(sdk).detail(id));
}

export function useProductVariants(id: string) {
  const sdk = useApiSdk();
  return useQuery(productQueryOptions(sdk).variants(id));
}

export function useCreateProduct() {
  const sdk = useApiSdk();
  const client = useQueryClient();
  return useMutation(productMutationOptions(sdk, client).create());
}

export function useUpdateProduct() {
  const sdk = useApiSdk();
  const client = useQueryClient();
  return useMutation(productMutationOptions(sdk, client).update());
}

export function useDeleteProduct() {
  const sdk = useApiSdk();
  const client = useQueryClient();
  return useMutation(productMutationOptions(sdk, client).remove());
}

export function useUpdateProductPublication() {
  const sdk = useApiSdk();
  const client = useQueryClient();
  return useMutation(productMutationOptions(sdk, client).updatePublication());
}

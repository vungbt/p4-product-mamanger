import {
  mutationOptions,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiSdk } from '../shared/client.js';
import {
  createProductApi,
  type ProductListQuery,
  type StorefrontProductListQuery,
} from '../shared/products.js';
import { useApiSdk } from './provider.js';
import {
  type ApiMutationSettings,
  apiKeys,
  getAdminProductsIdQueryOptions,
  getAdminProductsIdVariantsQueryOptions,
  getAdminProductsQueryOptions,
  getProductsBySlugSlugQueryOptions,
  getProductsIdQueryOptions,
  getProductsQueryOptions,
  resourceInvalidationKeys,
} from './resources.js';

// Share operation keys with generated hooks, including separate admin/storefront scopes.
export const productKeys = {
  all: apiKeys.all,
  lists: () => ['api', 'get_api_admin_products'] as const,
  list: (query?: ProductListQuery) => apiKeys.operation('get_api_admin_products', { query }),
  details: () => ['api', 'get_api_admin_products_id'] as const,
  detail: (id: string) => apiKeys.operation('get_api_admin_products_id', { path: { id } }),
  variants: (id: string) =>
    apiKeys.operation('get_api_admin_products_id_variants', { path: { id } }),
  storefrontList: (query?: StorefrontProductListQuery) =>
    apiKeys.operation('get_api_products', { query }),
  storefrontDetail: (id: string) => apiKeys.operation('get_api_products_id', { path: { id } }),
  bySlug: (slug: string) => apiKeys.operation('get_api_products_by_slug_slug', { path: { slug } }),
};

export function productQueryOptions(sdk: ApiSdk) {
  return {
    list: (query?: ProductListQuery) => getAdminProductsQueryOptions(sdk, { params: { query } }),
    detail: (id: string) =>
      getAdminProductsIdQueryOptions(sdk, { params: { path: { id } } }, { enabled: Boolean(id) }),
    variants: (id: string) =>
      getAdminProductsIdVariantsQueryOptions(
        sdk,
        { params: { path: { id } } },
        { enabled: Boolean(id) },
      ),
    storefrontList: (query?: StorefrontProductListQuery) =>
      getProductsQueryOptions(sdk, { params: { query } }),
    storefrontDetail: (id: string) =>
      getProductsIdQueryOptions(sdk, { params: { path: { id } } }, { enabled: Boolean(id) }),
    bySlug: (slug: string) =>
      getProductsBySlugSlugQueryOptions(
        sdk,
        { params: { path: { slug } } },
        { enabled: Boolean(slug) },
      ),
  };
}

export function productMutationOptions(
  sdk: ApiSdk,
  client: QueryClient,
  settings?: ApiMutationSettings,
) {
  const api = createProductApi(sdk);

  const refresh = () =>
    Promise.all(
      (settings?.invalidate ?? resourceInvalidationKeys.products ?? []).map((queryKey) =>
        client.invalidateQueries({ queryKey }),
      ),
    );

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    remove: () => mutationOptions({ mutationFn: api.remove, retry: false, onSuccess: refresh }),
    updatePublication: () =>
      mutationOptions({ mutationFn: api.updatePublication, retry: false, onSuccess: refresh }),
    createVariant: () =>
      mutationOptions({ mutationFn: api.createVariant, retry: false, onSuccess: refresh }),
    updateVariant: () =>
      mutationOptions({ mutationFn: api.updateVariant, retry: false, onSuccess: refresh }),
    updateVariantImages: () =>
      mutationOptions({ mutationFn: api.updateVariantImages, retry: false, onSuccess: refresh }),
    addImage: () => mutationOptions({ mutationFn: api.addImage, retry: false, onSuccess: refresh }),
    removeImage: () =>
      mutationOptions({ mutationFn: api.removeImage, retry: false, onSuccess: refresh }),
  };
}

export function useProducts(query?: ProductListQuery) {
  return useQuery(productQueryOptions(useApiSdk()).list(query));
}

export function useProduct(id: string) {
  return useQuery(productQueryOptions(useApiSdk()).detail(id));
}

export function useProductVariants(id: string) {
  return useQuery(productQueryOptions(useApiSdk()).variants(id));
}

export function useStorefrontProducts(query?: StorefrontProductListQuery) {
  return useQuery(productQueryOptions(useApiSdk()).storefrontList(query));
}

export function useStorefrontProduct(id: string) {
  return useQuery(productQueryOptions(useApiSdk()).storefrontDetail(id));
}

export function useProductBySlug(slug: string) {
  return useQuery(productQueryOptions(useApiSdk()).bySlug(slug));
}

export function useCreateProduct(settings?: ApiMutationSettings) {
  return useMutation(productMutationOptions(useApiSdk(), useQueryClient(), settings).create());
}

export function useUpdateProduct(settings?: ApiMutationSettings) {
  return useMutation(productMutationOptions(useApiSdk(), useQueryClient(), settings).update());
}

export function useDeleteProduct(settings?: ApiMutationSettings) {
  return useMutation(productMutationOptions(useApiSdk(), useQueryClient(), settings).remove());
}

export function useUpdateProductPublication(settings?: ApiMutationSettings) {
  return useMutation(
    productMutationOptions(useApiSdk(), useQueryClient(), settings).updatePublication(),
  );
}

export function useCreateProductVariant(settings?: ApiMutationSettings) {
  return useMutation(
    productMutationOptions(useApiSdk(), useQueryClient(), settings).createVariant(),
  );
}

export function useUpdateProductVariant(settings?: ApiMutationSettings) {
  return useMutation(
    productMutationOptions(useApiSdk(), useQueryClient(), settings).updateVariant(),
  );
}

export function useUpdateProductVariantImages(settings?: ApiMutationSettings) {
  return useMutation(
    productMutationOptions(useApiSdk(), useQueryClient(), settings).updateVariantImages(),
  );
}

export function useAddProductImage(settings?: ApiMutationSettings) {
  return useMutation(productMutationOptions(useApiSdk(), useQueryClient(), settings).addImage());
}

export function useRemoveProductImage(settings?: ApiMutationSettings) {
  return useMutation(productMutationOptions(useApiSdk(), useQueryClient(), settings).removeImage());
}

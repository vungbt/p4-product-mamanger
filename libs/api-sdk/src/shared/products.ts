import type { ApiSdk } from './client.js';
import type { paths } from './generated.js';
import * as operations from './resources.js';

export type ProductListQuery = NonNullable<
  paths['/api/admin/products']['get']['parameters']['query']
>;

export type StorefrontProductListQuery = NonNullable<
  paths['/api/products']['get']['parameters']['query']
>;

export type ProductInput =
  paths['/api/products']['post']['requestBody']['content']['application/json'];
// The update service rejects stock even though the current OpenAPI PATCH schema includes it.

export type ProductUpdateInput = Omit<
  NonNullable<paths['/api/products/{id}']['patch']['requestBody']>['content']['application/json'],
  'stock'
> & { stock?: never };

export type ProductPublicationInput =
  paths['/api/products/{id}/publication']['patch']['requestBody']['content']['application/json'];

export type ProductVariantInput =
  paths['/api/products/{id}/variants']['post']['requestBody']['content']['application/json'];

export type ProductVariantUpdateInput =
  paths['/api/products/{id}/variants/{variantId}']['patch']['requestBody']['content']['application/json'];

export type ProductVariantImagesInput =
  paths['/api/products/{id}/variants/{variantId}/images']['patch']['requestBody']['content']['application/json'];

export type ProductImageInput =
  paths['/api/products/{id}/images']['post']['requestBody']['content']['application/json'];

export type Product =
  paths['/api/admin/products']['get']['responses'][200]['content']['application/json']['data'][number];

export type ProductDetail =
  paths['/api/admin/products/{id}']['get']['responses'][200]['content']['application/json']['data'];

export function createProductApi(sdk: ApiSdk) {
  return {
    list: (query?: ProductListQuery, signal?: AbortSignal) =>
      operations.getAdminProducts(sdk, { params: { query }, signal }),
    detail: (id: string, signal?: AbortSignal) =>
      operations.getAdminProductsId(sdk, { params: { path: { id } }, signal }),
    variants: (id: string, signal?: AbortSignal) =>
      operations.getAdminProductsIdVariants(sdk, { params: { path: { id } }, signal }),
    storefrontList: (query?: StorefrontProductListQuery, signal?: AbortSignal) =>
      operations.getProducts(sdk, { params: { query }, signal }),
    storefrontDetail: (id: string, signal?: AbortSignal) =>
      operations.getProductsId(sdk, { params: { path: { id } }, signal }),
    bySlug: (slug: string, signal?: AbortSignal) =>
      operations.getProductsBySlugSlug(sdk, { params: { path: { slug } }, signal }),
    create: (body: ProductInput) => operations.postProducts(sdk, { body }),
    update: ({ id, body }: { id: string; body: ProductUpdateInput }) =>
      operations.patchProductsId(sdk, { params: { path: { id } }, body }),
    remove: (id: string) => operations.deleteProductsId(sdk, { params: { path: { id } } }),
    updatePublication: ({ id, body }: { id: string; body: ProductPublicationInput }) =>
      operations.patchProductsIdPublication(sdk, { params: { path: { id } }, body }),
    createVariant: ({ id, body }: { id: string; body: ProductVariantInput }) =>
      operations.postProductsIdVariants(sdk, { params: { path: { id } }, body }),
    updateVariant: ({
      id,
      variantId,
      body,
    }: {
      id: string;
      variantId: string;
      body: ProductVariantUpdateInput;
    }) =>
      operations.patchProductsIdVariantsVariantId(sdk, {
        params: { path: { id, variantId } },
        body,
      }),
    updateVariantImages: ({
      id,
      variantId,
      body,
    }: {
      id: string;
      variantId: string;
      body: ProductVariantImagesInput;
    }) =>
      operations.patchProductsIdVariantsVariantIdImages(sdk, {
        params: { path: { id, variantId } },
        body,
      }),
    addImage: ({ id, body }: { id: string; body: ProductImageInput }) =>
      operations.postProductsIdImages(sdk, { params: { path: { id } }, body }),
    removeImage: ({ id, imageId }: { id: string; imageId: string }) =>
      operations.deleteProductsIdImagesImageId(sdk, { params: { path: { id, imageId } } }),
  };
}

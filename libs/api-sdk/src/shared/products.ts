import type { ApiSdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type ProductListQuery = NonNullable<
  paths['/api/admin/products']['get']['parameters']['query']
>;
export type ProductInput =
  paths['/api/products']['post']['requestBody']['content']['application/json'];
export type PublicationInput =
  paths['/api/products/{id}/publication']['patch']['requestBody']['content']['application/json'];

export function createProductApi(sdk: ApiSdk) {
  return {
    list: async (query?: ProductListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/admin/products', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/admin/products/{id}', { params: { path: { id } }, signal })),
    create: async (body: ProductInput) => unwrap(await sdk.POST('/api/products', { body })),
    update: async ({ id, body }: { id: string; body: ProductInput }) =>
      unwrap(await sdk.PUT('/api/products/{id}', { params: { path: { id } }, body })),
    remove: async (id: string) =>
      unwrap(await sdk.DELETE('/api/products/{id}', { params: { path: { id } } })),
    updatePublication: async ({ id, body }: { id: string; body: PublicationInput }) =>
      unwrap(await sdk.PATCH('/api/products/{id}/publication', { params: { path: { id } }, body })),
    variants: async (id: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/admin/products/{id}/variants', { params: { path: { id } }, signal }),
      ),
  };
}

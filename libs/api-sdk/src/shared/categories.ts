import type { ApiSdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type CategoryListQuery = NonNullable<paths['/api/categories']['get']['parameters']['query']>;
export type CategoryInput =
  paths['/api/categories']['post']['requestBody']['content']['application/json'];

export function createCategoryApi(sdk: ApiSdk) {
  return {
    list: async (query?: CategoryListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/categories', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/categories/{id}', { params: { path: { id } }, signal })),
    create: async (body: CategoryInput) => unwrap(await sdk.POST('/api/categories', { body })),
    update: async ({ id, body }: { id: string; body: CategoryInput }) =>
      unwrap(await sdk.PUT('/api/categories/{id}', { params: { path: { id } }, body })),
    remove: async (id: string) =>
      unwrap(await sdk.DELETE('/api/categories/{id}', { params: { path: { id } } })),
  };
}

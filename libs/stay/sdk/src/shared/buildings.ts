import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type BuildingListQuery = NonNullable<paths['/api/buildings']['get']['parameters']['query']>;
export type BuildingCreateInput =
  paths['/api/buildings']['post']['requestBody']['content']['application/json'];
export type BuildingUpdateInput =
  paths['/api/buildings/{id}']['put']['requestBody']['content']['application/json'];
export type BuildingPriceInput =
  paths['/api/buildings/{id}/prices']['put']['requestBody']['content']['application/json'];

/** `/api/buildings` and per-building prices. */
export function createBuildingApi(sdk: StaySdk) {
  return {
    /** Paginated `{ data, meta }`. */
    list: async (query?: BuildingListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/buildings', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/buildings/{id}', { params: { path: { id } }, signal })).data,
    create: async (body: BuildingCreateInput) =>
      unwrap(await sdk.POST('/api/buildings', { body })).data,
    update: async ({ id, body }: { id: string; body: BuildingUpdateInput }) =>
      unwrap(await sdk.PUT('/api/buildings/{id}', { params: { path: { id } }, body })).data,
    archive: async (id: string) =>
      unwrap(await sdk.POST('/api/buildings/{id}/archive', { params: { path: { id } } })).data,
    /** Prices in force on `date` (`YYYY-MM-DD`, default today in Asia/Ho_Chi_Minh). */
    prices: async (id: string, date?: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{id}/prices', {
          params: { path: { id }, query: date ? { date } : {} },
          signal,
        }),
      ).data,
    setPrice: async ({ id, body }: { id: string; body: BuildingPriceInput }) =>
      unwrap(await sdk.PUT('/api/buildings/{id}/prices', { params: { path: { id } }, body })).data,
  };
}

import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type MaintenanceListQuery = NonNullable<
  paths['/api/maintenance']['get']['parameters']['query']
>;
export type MaintenanceCreateInput =
  paths['/api/maintenance']['post']['requestBody']['content']['application/json'];
export type MaintenanceUpdateInput =
  paths['/api/maintenance/{id}']['put']['requestBody']['content']['application/json'];
export type MaintenanceExpenseInput =
  paths['/api/maintenance/{id}/expense']['post']['requestBody']['content']['application/json'];

export function createMaintenanceApi(sdk: StaySdk) {
  return {
    categories: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/maintenance/expense-categories', { signal })).data,
    list: async (query?: MaintenanceListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/maintenance', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/maintenance/{id}', { params: { path: { id } }, signal })).data,
    create: async (body: MaintenanceCreateInput) =>
      unwrap(await sdk.POST('/api/maintenance', { body })).data,
    update: async ({ id, body }: { id: string; body: MaintenanceUpdateInput }) =>
      unwrap(await sdk.PUT('/api/maintenance/{id}', { params: { path: { id } }, body })).data,
    expense: async ({ id, body }: { id: string; body: MaintenanceExpenseInput }) =>
      unwrap(await sdk.POST('/api/maintenance/{id}/expense', { params: { path: { id } }, body }))
        .data,
  };
}

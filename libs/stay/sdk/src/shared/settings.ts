import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type StaySettingsInput =
  paths['/api/settings']['put']['requestBody']['content']['application/json'];
export type StayServiceCreateInput =
  paths['/api/services']['post']['requestBody']['content']['application/json'];
export type StayServiceUpdateInput =
  paths['/api/services/{id}']['put']['requestBody']['content']['application/json'];

/** `GET/PUT /api/settings` and the service catalogue (`/api/services`). */
export function createSettingsApi(sdk: StaySdk) {
  return {
    settings: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/settings', { signal })).data,
    updateSettings: async (body: StaySettingsInput) =>
      unwrap(await sdk.PUT('/api/settings', { body })).data,
    services: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/services', { signal })).data,
    createService: async (body: StayServiceCreateInput) =>
      unwrap(await sdk.POST('/api/services', { body })).data,
    updateService: async ({ id, body }: { id: string; body: StayServiceUpdateInput }) =>
      unwrap(await sdk.PUT('/api/services/{id}', { params: { path: { id } }, body })).data,
  };
}

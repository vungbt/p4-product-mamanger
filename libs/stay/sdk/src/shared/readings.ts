import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type ReadingBulkInput =
  paths['/api/buildings/{buildingId}/readings']['put']['requestBody']['content']['application/json'];
export type ReadingUpdateInput =
  paths['/api/readings/{id}']['put']['requestBody']['content']['application/json'];
export type MeterReplacementInput =
  paths['/api/meters/{id}/replace']['post']['requestBody']['content']['application/json'];

export function createReadingApi(sdk: StaySdk) {
  return {
    grid: async (buildingId: string, period: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/readings', {
          params: { path: { buildingId }, query: { period } },
          signal,
        }),
      ).data,
    save: async ({ buildingId, body }: { buildingId: string; body: ReadingBulkInput }) =>
      unwrap(
        await sdk.PUT('/api/buildings/{buildingId}/readings', {
          params: { path: { buildingId } },
          body,
        }),
      ).data,
    update: async ({ id, body }: { id: string; body: ReadingUpdateInput }) =>
      unwrap(await sdk.PUT('/api/readings/{id}', { params: { path: { id } }, body })).data,
    replace: async ({
      id,
      body,
      idempotencyKey,
    }: {
      id: string;
      body: MeterReplacementInput;
      idempotencyKey?: string;
    }) =>
      unwrap(
        await sdk.POST('/api/meters/{id}/replace', {
          params: { path: { id } },
          body,
          headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
        }),
      ).data,
  };
}

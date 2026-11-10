import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type RoomListQuery = NonNullable<
  paths['/api/buildings/{buildingId}/rooms']['get']['parameters']['query']
>;
export type RoomCreateInput =
  paths['/api/buildings/{buildingId}/rooms']['post']['requestBody']['content']['application/json'];
export type RoomUpdateInput =
  paths['/api/rooms/{id}']['put']['requestBody']['content']['application/json'];
export type RoomBulkPreviewInput =
  paths['/api/buildings/{buildingId}/rooms/bulk/preview']['post']['requestBody']['content']['application/json'];
export type RoomBulkInput =
  paths['/api/buildings/{buildingId}/rooms/bulk']['post']['requestBody']['content']['application/json'];
export type RoomMaintenanceInput =
  paths['/api/rooms/{id}/maintenance']['post']['requestBody']['content']['application/json'];

/** `/api/buildings/:buildingId/rooms` (room map, creation) and `/api/rooms/:id`. */
export function createRoomApi(sdk: StaySdk) {
  return {
    /** Paginated `{ data, meta }` of the building's active rooms. */
    list: async (buildingId: string, query?: RoomListQuery, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/rooms', {
          params: { path: { buildingId }, query },
          signal,
        }),
      ),
    summary: async (buildingId: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/rooms/summary', {
          params: { path: { buildingId } },
          signal,
        }),
      ).data,
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/rooms/{id}', { params: { path: { id } }, signal })).data,
    create: async ({ buildingId, body }: { buildingId: string; body: RoomCreateInput }) =>
      unwrap(
        await sdk.POST('/api/buildings/{buildingId}/rooms', {
          params: { path: { buildingId } },
          body,
        }),
      ).data,
    update: async ({ id, body }: { id: string; body: RoomUpdateInput }) =>
      unwrap(await sdk.PUT('/api/rooms/{id}', { params: { path: { id } }, body })).data,
    bulkPreview: async ({ buildingId, body }: { buildingId: string; body: RoomBulkPreviewInput }) =>
      unwrap(
        await sdk.POST('/api/buildings/{buildingId}/rooms/bulk/preview', {
          params: { path: { buildingId } },
          body,
        }),
      ).data,
    /** Reuse the same `idempotencyKey` when retrying the same batch. */
    bulkCreate: async ({
      buildingId,
      idempotencyKey,
      body,
    }: {
      buildingId: string;
      idempotencyKey: string;
      body: RoomBulkInput;
    }) =>
      unwrap(
        await sdk.POST('/api/buildings/{buildingId}/rooms/bulk', {
          params: { path: { buildingId }, header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ).data,
    setMaintenance: async ({ id, body }: { id: string; body: RoomMaintenanceInput }) =>
      unwrap(await sdk.POST('/api/rooms/{id}/maintenance', { params: { path: { id } }, body }))
        .data,
    archive: async (id: string) =>
      unwrap(await sdk.POST('/api/rooms/{id}/archive', { params: { path: { id } } })).data,
  };
}

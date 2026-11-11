import {
  keepPreviousData,
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createRoomApi, type RoomListQuery } from '../shared/rooms.js';
import { buildingKeys } from './buildings.js';
import { useStaySdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

/** Room query keys; building-scoped keys include the building id so switching reloads them. */
export const roomKeys = {
  all: key('stay', 'rooms'),
  building: (buildingId: string) => key('stay', 'rooms', 'building', buildingId),
  list: (buildingId: string, query?: RoomListQuery) =>
    key('stay', 'rooms', 'building', buildingId, 'list', query ?? {}),
  summary: (buildingId: string) => key('stay', 'rooms', 'building', buildingId, 'summary'),
  details: () => key('stay', 'rooms', 'detail'),
  detail: (id: string) => key('stay', 'rooms', 'detail', id),
};

export function roomQueryOptions(sdk: StaySdk) {
  const api = createRoomApi(sdk);

  return {
    list: (buildingId: string, query?: RoomListQuery) =>
      queryOptions({
        queryKey: roomKeys.list(buildingId, query),
        queryFn: ({ signal }) => api.list(buildingId, query, signal),
        enabled: Boolean(buildingId),
        placeholderData: keepPreviousData,
      }),
    summary: (buildingId: string) =>
      queryOptions({
        queryKey: roomKeys.summary(buildingId),
        queryFn: ({ signal }) => api.summary(buildingId, signal),
        enabled: Boolean(buildingId),
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: roomKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function roomMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createRoomApi(sdk);
  // Room counts appear on buildings and the overview too.
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: roomKeys.all }),
      client.invalidateQueries({ queryKey: buildingKeys.all }),
      client.invalidateQueries({ queryKey: ['stay', 'overview'] }),
    ]);

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    bulkPreview: () => mutationOptions({ mutationFn: api.bulkPreview, retry: false }),
    bulkCreate: () =>
      mutationOptions({ mutationFn: api.bulkCreate, retry: false, onSuccess: refresh }),
    setMaintenance: () =>
      mutationOptions({ mutationFn: api.setMaintenance, retry: false, onSuccess: refresh }),
    archive: () => mutationOptions({ mutationFn: api.archive, retry: false, onSuccess: refresh }),
  };
}

/** `GET /api/buildings/:buildingId/rooms`: the room map (filters, paginated). */
export function useRooms(buildingId: string, query?: RoomListQuery) {
  const sdk = useStaySdk();

  return useQuery(roomQueryOptions(sdk).list(buildingId, query));
}

/** `GET /api/buildings/:buildingId/rooms/summary`: counters per status and floors. */
export function useRoomSummary(buildingId: string) {
  const sdk = useStaySdk();

  return useQuery(roomQueryOptions(sdk).summary(buildingId));
}

/** `GET /api/rooms/:id`; 404 also means "in a building outside your scope". */
export function useRoom(id: string) {
  const sdk = useStaySdk();

  return useQuery(roomQueryOptions(sdk).detail(id));
}

export function useCreateRoom() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).create());
}

export function useUpdateRoom() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).update());
}

export function usePreviewBulkRooms() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).bulkPreview());
}

/** `POST /api/buildings/:buildingId/rooms/bulk` with an `Idempotency-Key`. */
export function useBulkCreateRooms() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).bulkCreate());
}

export function useSetRoomMaintenance() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).setMaintenance());
}

export function useArchiveRoom() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(roomMutationOptions(sdk, client).archive());
}

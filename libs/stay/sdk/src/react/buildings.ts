import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type BuildingListQuery, createBuildingApi } from '../shared/buildings.js';
import type { StaySdk } from '../shared/client.js';
import { useStaySdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const buildingKeys = {
  all: key('stay', 'buildings'),
  lists: () => key('stay', 'buildings', 'list'),
  list: (query?: BuildingListQuery) => key('stay', 'buildings', 'list', query ?? {}),
  details: () => key('stay', 'buildings', 'detail'),
  detail: (id: string) => key('stay', 'buildings', 'detail', id),
  prices: (id: string, date?: string) => key('stay', 'buildings', 'prices', id, date ?? 'today'),
};

export function buildingQueryOptions(sdk: StaySdk) {
  const api = createBuildingApi(sdk);

  return {
    list: (query?: BuildingListQuery) =>
      queryOptions({
        queryKey: buildingKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: buildingKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
    prices: (id: string, date?: string) =>
      queryOptions({
        queryKey: buildingKeys.prices(id, date),
        queryFn: ({ signal }) => api.prices(id, date, signal),
        enabled: Boolean(id),
      }),
  };
}

export function buildingMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createBuildingApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: buildingKeys.all });

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    archive: () => mutationOptions({ mutationFn: api.archive, retry: false, onSuccess: refresh }),
    setPrice: () => mutationOptions({ mutationFn: api.setPrice, retry: false, onSuccess: refresh }),
  };
}

/**
 * `GET /api/buildings`: the buildings the user may read (managers: assigned ones), paginated.
 * The header building selector can use `{ pageSize: 100 }`.
 */
export function useBuildings(query?: BuildingListQuery, options?: { enabled?: boolean }) {
  const sdk = useStaySdk();

  return useQuery({ ...buildingQueryOptions(sdk).list(query), ...options });
}

/** `GET /api/buildings/:id`; 404 also means "outside your buildings". */
export function useBuilding(id: string) {
  const sdk = useStaySdk();

  return useQuery(buildingQueryOptions(sdk).detail(id));
}

/** `GET /api/buildings/:id/prices?date=` (default today, Asia/Ho_Chi_Minh). */
export function useBuildingPrices(id: string, date?: string) {
  const sdk = useStaySdk();

  return useQuery(buildingQueryOptions(sdk).prices(id, date));
}

export function useCreateBuilding() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(buildingMutationOptions(sdk, client).create());
}

export function useUpdateBuilding() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(buildingMutationOptions(sdk, client).update());
}

export function useArchiveBuilding() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(buildingMutationOptions(sdk, client).archive());
}

export function useSetBuildingPrice() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(buildingMutationOptions(sdk, client).setPrice());
}

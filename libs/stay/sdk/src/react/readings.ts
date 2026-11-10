import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createReadingApi } from '../shared/readings.js';
import { useStaySdk } from './provider.js';

export const readingKeys = {
  all: ['stay', 'readings'] as const,
  grid: (buildingId: string, period: string) => ['stay', 'readings', buildingId, period] as const,
};

export function readingQueryOptions(sdk: StaySdk) {
  const api = createReadingApi(sdk);
  return {
    grid: (buildingId: string, period: string) =>
      queryOptions({
        queryKey: readingKeys.grid(buildingId, period),
        queryFn: ({ signal }) => api.grid(buildingId, period, signal),
        enabled: Boolean(buildingId),
        staleTime: 30_000,
      }),
  };
}

export function readingMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createReadingApi(sdk);
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: readingKeys.all }),
      client.invalidateQueries({ queryKey: ['stay', 'rooms'] }),
    ]);
  };
  return {
    save: () => mutationOptions({ mutationFn: api.save, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    replace: () => mutationOptions({ mutationFn: api.replace, retry: false, onSuccess: refresh }),
  };
}

export function useReadings(buildingId: string, period: string) {
  return useQuery(readingQueryOptions(useStaySdk()).grid(buildingId, period));
}

export function useSaveReadings() {
  return useMutation(readingMutationOptions(useStaySdk(), useQueryClient()).save());
}

export function useUpdateReading() {
  return useMutation(readingMutationOptions(useStaySdk(), useQueryClient()).update());
}

export function useReplaceMeter() {
  return useMutation(readingMutationOptions(useStaySdk(), useQueryClient()).replace());
}

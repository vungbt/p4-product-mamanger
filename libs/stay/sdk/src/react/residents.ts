import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createResidentApi, type ResidentListQuery } from '../shared/residents.js';
import { useStaySdk } from './provider.js';

export const residentKeys = {
  all: ['stay', 'residents'] as const,
  list: (buildingId: string, query: ResidentListQuery) =>
    ['stay', 'residents', buildingId, query] as const,
};

export function residentQueryOptions(sdk: StaySdk) {
  const api = createResidentApi(sdk);

  return {
    list: (buildingId: string, query: ResidentListQuery) =>
      queryOptions({
        queryKey: residentKeys.list(buildingId, query),
        queryFn: ({ signal }) => api.list(buildingId, query, signal),
        enabled: Boolean(buildingId),
      }),
  };
}

export function residentMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createResidentApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: residentKeys.all });

  return {
    register: () => mutationOptions({ mutationFn: api.register, retry: false, onSuccess: refresh }),
    unmark: () => mutationOptions({ mutationFn: api.unmark, retry: false, onSuccess: refresh }),
    export: () => mutationOptions({ mutationFn: api.export, retry: false }),
  };
}

export function useResidents(buildingId: string, query: ResidentListQuery) {
  return useQuery(residentQueryOptions(useStaySdk()).list(buildingId, query));
}

export function useRegisterResident() {
  return useMutation(residentMutationOptions(useStaySdk(), useQueryClient()).register());
}

export function useUnmarkResident() {
  return useMutation(residentMutationOptions(useStaySdk(), useQueryClient()).unmark());
}

export function useExportResidents() {
  return useMutation(residentMutationOptions(useStaySdk(), useQueryClient()).export());
}

import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createSettingsApi } from '../shared/settings.js';
import { buildingKeys } from './buildings.js';
import { useStaySdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const settingsKeys = {
  all: key('stay', 'settings'),
  billing: () => key('stay', 'settings', 'billing'),
  services: () => key('stay', 'settings', 'services'),
};

export function settingsQueryOptions(sdk: StaySdk) {
  const api = createSettingsApi(sdk);

  return {
    billing: () =>
      queryOptions({
        queryKey: settingsKeys.billing(),
        queryFn: ({ signal }) => api.settings(signal),
      }),
    services: () =>
      queryOptions({
        queryKey: settingsKeys.services(),
        queryFn: ({ signal }) => api.services(signal),
      }),
  };
}

/** Settings and services feed building billing and prices: both caches are refreshed. */
export function settingsMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createSettingsApi(sdk);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: settingsKeys.all }),
      client.invalidateQueries({ queryKey: buildingKeys.all }),
    ]);

  return {
    updateSettings: () =>
      mutationOptions({ mutationFn: api.updateSettings, retry: false, onSuccess: refresh }),
    createService: () =>
      mutationOptions({ mutationFn: api.createService, retry: false, onSuccess: refresh }),
    updateService: () =>
      mutationOptions({ mutationFn: api.updateService, retry: false, onSuccess: refresh }),
  };
}

/** `GET /api/settings` (read Settings). */
export function useStaySettings() {
  const sdk = useStaySdk();

  return useQuery(settingsQueryOptions(sdk).billing());
}

/** `GET /api/services` (read Settings): every service, including inactive ones. */
export function useServices() {
  const sdk = useStaySdk();

  return useQuery(settingsQueryOptions(sdk).services());
}

export function useUpdateStaySettings() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(settingsMutationOptions(sdk, client).updateSettings());
}

export function useCreateService() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(settingsMutationOptions(sdk, client).createService());
}

export function useUpdateService() {
  const sdk = useStaySdk();
  const client = useQueryClient();

  return useMutation(settingsMutationOptions(sdk, client).updateService());
}

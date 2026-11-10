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
import { createTenantApi, type TenantListQuery } from '../shared/tenants.js';
import { useStaySdk } from './provider.js';

function key<const T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

export const tenantKeys = {
  all: key('stay', 'tenants'),
  lists: () => key('stay', 'tenants', 'list'),
  list: (query?: TenantListQuery) => key('stay', 'tenants', 'list', query ?? {}),
  details: () => key('stay', 'tenants', 'detail'),
  detail: (id: string) => key('stay', 'tenants', 'detail', id),
};

export function tenantQueryOptions(sdk: StaySdk) {
  const api = createTenantApi(sdk);

  return {
    list: (query?: TenantListQuery) =>
      queryOptions({
        queryKey: tenantKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: tenantKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function tenantMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createTenantApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: tenantKeys.all });

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    archive: () => mutationOptions({ mutationFn: api.archive, retry: false, onSuccess: refresh }),
    revealIdNumber: () => mutationOptions({ mutationFn: api.revealIdNumber, retry: false }),
    attachDocument: () =>
      mutationOptions({ mutationFn: api.attachDocument, retry: false, onSuccess: refresh }),
    addVehicle: () =>
      mutationOptions({ mutationFn: api.addVehicle, retry: false, onSuccess: refresh }),
    updateVehicle: () =>
      mutationOptions({ mutationFn: api.updateVehicle, retry: false, onSuccess: refresh }),
    removeVehicle: () =>
      mutationOptions({ mutationFn: api.removeVehicle, retry: false, onSuccess: refresh }),
    previewImport: () => mutationOptions({ mutationFn: api.previewImport, retry: false }),
    commitImport: () =>
      mutationOptions({ mutationFn: api.commitImport, retry: false, onSuccess: refresh }),
  };
}

/** `GET /api/tenants`: tenants of the buildings the user may read (pass `buildingId`). */
export function useTenants(query?: TenantListQuery) {
  const sdk = useStaySdk();

  return useQuery(tenantQueryOptions(sdk).list(query));
}

/** `GET /api/tenants/:id`; document URLs expire after 5 minutes (refetch to renew). */
export function useTenant(id: string) {
  const sdk = useStaySdk();

  return useQuery(tenantQueryOptions(sdk).detail(id));
}

function useTenantMutations() {
  return tenantMutationOptions(useStaySdk(), useQueryClient());
}

export function useCreateTenant() {
  return useMutation(useTenantMutations().create());
}

export function useUpdateTenant() {
  return useMutation(useTenantMutations().update());
}

export function useArchiveTenant() {
  return useMutation(useTenantMutations().archive());
}

/** `POST /api/tenants/:id/reveal-id`: the full CCCD, never cached. */
export function useRevealTenantIdNumber() {
  return useMutation(useTenantMutations().revealIdNumber());
}

export function useAttachTenantDocument() {
  return useMutation(useTenantMutations().attachDocument());
}

export function useAddVehicle() {
  return useMutation(useTenantMutations().addVehicle());
}

export function useUpdateVehicle() {
  return useMutation(useTenantMutations().updateVehicle());
}

export function useRemoveVehicle() {
  return useMutation(useTenantMutations().removeVehicle());
}

export function usePreviewTenantImport() {
  return useMutation(useTenantMutations().previewImport());
}

export function useCommitTenantImport() {
  return useMutation(useTenantMutations().commitImport());
}

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
import {
  type ContractInput,
  type ContractListQuery,
  createContractApi,
} from '../shared/contracts.js';
import { useStaySdk } from './provider.js';

export const contractKeys = {
  all: ['stay', 'contracts'] as const,
  list: (query?: ContractListQuery) => ['stay', 'contracts', 'list', query ?? {}] as const,
  detail: (id: string) => ['stay', 'contracts', 'detail', id] as const,
  preview: (id: string) => ['stay', 'contracts', 'preview', id] as const,
};

export function contractQueryOptions(sdk: StaySdk) {
  const api = createContractApi(sdk);

  return {
    list: (query?: ContractListQuery) =>
      queryOptions({
        queryKey: contractKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: contractKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
    preview: (id: string) =>
      queryOptions({
        queryKey: contractKeys.preview(id),
        queryFn: ({ signal }) => api.preview(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function contractMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createContractApi(sdk);
  const refresh = () =>
    Promise.all(
      ['contracts', 'rooms', 'tenants', 'buildings'].map((area) =>
        client.invalidateQueries({ queryKey: ['stay', area] }),
      ),
    );

  return {
    create: () =>
      mutationOptions({
        mutationFn: ({ idempotencyKey, ...body }: ContractInput & { idempotencyKey?: string }) =>
          api.create(body, idempotencyKey),
        retry: false,
        onSuccess: refresh,
      }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    activate: () => mutationOptions({ mutationFn: api.activate, retry: false, onSuccess: refresh }),
    cancel: () => mutationOptions({ mutationFn: api.cancel, retry: false, onSuccess: refresh }),
  };
}

export function useContracts(query?: ContractListQuery) {
  return useQuery(contractQueryOptions(useStaySdk()).list(query));
}

export function useContract(id: string) {
  return useQuery(contractQueryOptions(useStaySdk()).detail(id));
}

export function useMoveInPreview(id: string) {
  return useQuery(contractQueryOptions(useStaySdk()).preview(id));
}

function useContractMutations() {
  return contractMutationOptions(useStaySdk(), useQueryClient());
}

export function useCreateContract() {
  return useMutation(useContractMutations().create());
}

export function useUpdateContract() {
  return useMutation(useContractMutations().update());
}

export function useActivateContract() {
  return useMutation(useContractMutations().activate());
}

export function useCancelContract() {
  return useMutation(useContractMutations().cancel());
}

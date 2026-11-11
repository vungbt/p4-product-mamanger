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
  type ContractChangeCommand,
  type ContractInput,
  type ContractListQuery,
  type ContractSettlementInput,
  createContractApi,
} from '../shared/contracts.js';
import { useStaySdk } from './provider.js';

export const contractKeys = {
  all: ['stay', 'contracts'] as const,
  changePreview: (command: ContractChangeCommand) =>
    ['stay', 'contracts', 'change-preview', command] as const,
  list: (query?: ContractListQuery) => ['stay', 'contracts', 'list', query ?? {}] as const,
  detail: (id: string) => ['stay', 'contracts', 'detail', id] as const,
  preview: (id: string) => ['stay', 'contracts', 'preview', id] as const,
  settlementPreview: (id: string, body: ContractSettlementInput) =>
    ['stay', 'contracts', 'settlement-preview', id, body] as const,
};

/** Everything a settlement changes (ST-17): contract, room, tenants, invoices and ledgers. */
const SETTLEMENT_AREAS = [
  'contracts',
  'rooms',
  'tenants',
  'buildings',
  'invoices',
  'payments',
  'deposits',
  'readings',
];

export function contractQueryOptions(sdk: StaySdk) {
  const api = createContractApi(sdk);

  return {
    changePreview: (command: ContractChangeCommand, enabled = true) =>
      queryOptions({
        queryKey: contractKeys.changePreview(command),
        queryFn: () => api.change({ ...command, body: { ...command.body, preview: true } }),
        enabled,
        retry: false,
        staleTime: 0,
      }),
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
    /** Server-computed settlement for the entered move-out data (never cached as fresh). */
    settlementPreview: (id: string, body: ContractSettlementInput, enabled = true) =>
      queryOptions({
        queryKey: contractKeys.settlementPreview(id, body),
        queryFn: ({ signal }) => api.settlementPreview(id, body, signal),
        enabled: Boolean(id) && enabled,
        retry: false,
        staleTime: 0,
      }),
  };
}

export function contractMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createContractApi(sdk);
  const refresh = () =>
    Promise.all(
      ['contracts', 'rooms', 'tenants', 'buildings', 'invoices'].map((area) =>
        client.invalidateQueries({ queryKey: ['stay', area] }),
      ),
    );

  return {
    change: () => mutationOptions({ mutationFn: api.change, retry: false, onSuccess: refresh }),
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
    notice: () => mutationOptions({ mutationFn: api.notice, retry: false, onSuccess: refresh }),
    cancelNotice: () =>
      mutationOptions({ mutationFn: api.cancelNotice, retry: false, onSuccess: refresh }),
    settle: () =>
      mutationOptions({
        mutationFn: api.settle,
        retry: false,
        onSuccess: () =>
          Promise.all(
            SETTLEMENT_AREAS.map((area) => client.invalidateQueries({ queryKey: ['stay', area] })),
          ),
      }),
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

export function useContractChangePreview(command: ContractChangeCommand, enabled = true) {
  return useQuery(contractQueryOptions(useStaySdk()).changePreview(command, enabled));
}

export function useChangeContract() {
  return useMutation(useContractMutations().change());
}

export function useGiveNotice() {
  return useMutation(useContractMutations().notice());
}

export function useCancelNotice() {
  return useMutation(useContractMutations().cancelNotice());
}

export function useSettlementPreview(id: string, body: ContractSettlementInput, enabled = true) {
  return useQuery(contractQueryOptions(useStaySdk()).settlementPreview(id, body, enabled));
}

export function useSettleContract() {
  return useMutation(useContractMutations().settle());
}

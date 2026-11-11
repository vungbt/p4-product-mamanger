import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createPortalLinkApi } from '../shared/portal-links.js';
import { useStaySdk } from './provider.js';

export const portalLinkKeys = {
  all: ['stay', 'portal-links'] as const,
  list: (contractId: string) => ['stay', 'portal-links', contractId] as const,
};

export function portalLinkQueryOptions(sdk: StaySdk) {
  const api = createPortalLinkApi(sdk);

  return {
    list: (contractId: string) =>
      queryOptions({
        queryKey: portalLinkKeys.list(contractId),
        queryFn: ({ signal }) => api.list(contractId, signal),
        enabled: Boolean(contractId),
        staleTime: 0,
      }),
  };
}

export function portalLinkMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createPortalLinkApi(sdk);
  const refresh = () => client.invalidateQueries({ queryKey: portalLinkKeys.all });

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    revoke: () => mutationOptions({ mutationFn: api.revoke, retry: false, onSuccess: refresh }),
  };
}

export function usePortalLinks(contractId: string) {
  return useQuery(portalLinkQueryOptions(useStaySdk()).list(contractId));
}

export function useCreatePortalLink() {
  return useMutation(portalLinkMutationOptions(useStaySdk(), useQueryClient()).create());
}

export function useRevokePortalLink() {
  return useMutation(portalLinkMutationOptions(useStaySdk(), useQueryClient()).revoke());
}

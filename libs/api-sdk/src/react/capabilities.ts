import { useQuery } from '@tanstack/react-query';
import { ApiSdkError, unwrap } from '../shared/errors.js';
import { useApiSdk } from './provider.js';

export function useCapabilities(accountId: string | undefined) {
  const sdk = useApiSdk();

  return useQuery({
    queryKey: ['capabilities', accountId],
    enabled: Boolean(accountId),
    queryFn: async ({ signal }) => unwrap(await sdk.GET('/api/me/capabilities', { signal })),
    staleTime: 30_000,
    refetchOnWindowFocus: 'always',
    refetchInterval: 30_000,
    retry: (attempt, error) =>
      !(error instanceof ApiSdkError && [401, 403].includes(error.status)) && attempt < 1,
  });
}

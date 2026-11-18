import { ApiSdkProvider } from '@p4/api-sdk/react';
import { readAuthSession, subscribeAuthSession } from '@p4/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useEffect, useState } from 'react';
import { getApiSdk } from './session';

export type ApiQueryProviderProps = {
  children: ReactNode;
  /** Enable React Query Devtools (dev) */
  enableDevtools?: boolean;
};

export function ApiQueryProvider({ children, enableDevtools = false }: ApiQueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 1000 * 60 * 2,
          },
        },
      }),
  );

  useEffect(() => {
    let previous = readAuthSession()?.user.id;
    return subscribeAuthSession((session) => {
      const next = session?.user.id;
      if (next !== previous) {
        previous = next;
        client.clear();
      }
    });
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <ApiSdkProvider sdk={getApiSdk()}>{children}</ApiSdkProvider>
      {enableDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';

export type ApiQueryProviderProps = {
  children: ReactNode;
  /** Bật React Query Devtools (dev) */
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

  return (
    <QueryClientProvider client={client}>
      {children}
      {enableDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}

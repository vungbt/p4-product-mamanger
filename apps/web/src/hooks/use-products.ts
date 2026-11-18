import { getApiSdk, productKeys, useQuery } from '@p4/api-client';
import { unwrap } from '@p4/api-sdk/shared';

/** Public product list from the typed SDK (`GET /api/products`). */
export default function useProducts(params?: { page?: number; pageSize?: number; q?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const q = params?.q ?? '';

  return useQuery({
    queryKey: productKeys.list({ page, pageSize, q }),
    queryFn: async ({ signal }) =>
      unwrap(
        await getApiSdk().GET('/api/products', {
          params: { query: { page, pageSize, ...(q ? { q } : {}) } },
          signal,
        }),
      ),
  });
}

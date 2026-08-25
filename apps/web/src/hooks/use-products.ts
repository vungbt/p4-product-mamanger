// TODO: trainee implement CRUD — use @p4/api-client
// Example:
// const { data, isLoading } = useApiQuery<ApiPaginatedSuccess<Product>>({
//   endpoint: '/products',
//   params: { page: 1, pageSize: 20 },
//   queryKey: productKeys.list({ page: 1, pageSize: 20 }),
//   headerConf: { authorization: false },
// });

import { productKeys, useApiQuery } from '@p4/api-client';
import type { ApiPaginatedSuccess, Product } from '@p4/shared';

export default function useProducts(params?: { page?: number; pageSize?: number; q?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const q = params?.q ?? '';

  return useApiQuery<ApiPaginatedSuccess<Product>>({
    endpoint: '/products',
    params: { page, pageSize, q },
    queryKey: productKeys.list({ page, pageSize, q }),
    headerConf: { authorization: false },
  });
}

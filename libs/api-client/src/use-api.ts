import {
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient as useQueryClientTanstack,
} from '@tanstack/react-query';
import { axiosClient, type HeaderConf } from './axios-client';

export type TQueryKey<TKey, TListQuery = unknown, TDetailQuery = string> = {
  all: readonly [TKey];
  lists: () => readonly [...TQueryKey<TKey>['all'], 'list'];
  list: (
    query?: TListQuery,
  ) =>
    | readonly [...ReturnType<TQueryKey<TKey>['lists']>]
    | readonly [...ReturnType<TQueryKey<TKey>['lists']>, { query: TListQuery }];
  details: () => readonly [...TQueryKey<TKey>['all'], 'detail'];
  detail: (
    id: TDetailQuery,
    query?: TListQuery,
  ) =>
    | readonly [...ReturnType<TQueryKey<TKey>['details']>, TDetailQuery]
    | readonly [...ReturnType<TQueryKey<TKey>['details']>, TDetailQuery, { query: TListQuery }];
};

type QueryArgs<TParams, TQueryKey extends QueryKey = QueryKey> = {
  endpoint: string;
  params?: TParams;
  queryKey?: TQueryKey;
  headerConf?: HeaderConf;
};

type MutationArgs<TBody> = {
  endpoint: string;
  body?: TBody;
  headerConf?: HeaderConf;
};

export const useApiQuery = <TData = unknown, TParams = unknown>(
  { endpoint, params, queryKey, headerConf }: QueryArgs<TParams>,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData, Error> => {
  const finalQueryKey = queryKey ?? ([endpoint, params ?? {}] as QueryKey);

  return useQuery<TData, Error, TData>({
    ...options,
    queryKey: finalQueryKey,
    queryFn: async () => axiosClient.get<TParams, TData>(endpoint, params, headerConf),
  });
};

export const useQueryClient = (): QueryClient => useQueryClientTanstack();

export const useApiMutation = <TRes = unknown, TBody = unknown>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  options?: Omit<UseMutationOptions<TRes, Error, MutationArgs<TBody>>, 'mutationFn'>,
): UseMutationResult<TRes, Error, MutationArgs<TBody>> => {
  return useMutation({
    mutationFn: async ({ endpoint, body, headerConf }) => {
      if (method === 'POST') return axiosClient.post<TBody, TRes>(endpoint, body, headerConf);
      if (method === 'PUT') return axiosClient.put<TBody, TRes>(endpoint, body, headerConf);
      if (method === 'PATCH') return axiosClient.patch<TBody, TRes>(endpoint, body, headerConf);
      if (method === 'DELETE') return axiosClient.delete<TBody, TRes>(endpoint, body, headerConf);
      throw new Error(`Unsupported method: ${method}`);
    },
    ...options,
  });
};

export const queryKeysFactory = <T, TListQueryType = unknown, TDetailQueryType = string>(
  globalKey: T,
): TQueryKey<T, TListQueryType, TDetailQueryType> => {
  const queryKeyFactory: TQueryKey<T, TListQueryType, TDetailQueryType> = {
    all: [globalKey] as const,
    lists: () => [...queryKeyFactory.all, 'list'] as const,
    list: (query?: TListQueryType) =>
      query
        ? ([...queryKeyFactory.lists(), { query }] as const)
        : ([...queryKeyFactory.lists()] as const),
    details: () => [...queryKeyFactory.all, 'detail'] as const,
    detail: (id: TDetailQueryType, query?: TListQueryType) =>
      query
        ? ([...queryKeyFactory.details(), id, { query }] as const)
        : ([...queryKeyFactory.details(), id] as const),
  };

  return queryKeyFactory;
};

/** Query keys thường dùng trong P4 */
export const productKeys = queryKeysFactory<
  'products',
  { page?: number; pageSize?: number; q?: string }
>('products');
export const orderKeys = queryKeysFactory<'orders'>('orders');
export const categoryKeys = queryKeysFactory<'categories'>('categories');

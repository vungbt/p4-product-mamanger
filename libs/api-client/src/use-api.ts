import { type QueryClient, useQueryClient as useQueryClientTanstack } from '@tanstack/react-query';

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

export const useQueryClient = (): QueryClient => useQueryClientTanstack();

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

/** Query keys commonly used in P4 */
export const productKeys = queryKeysFactory<
  'products',
  { page?: number; pageSize?: number; q?: string }
>('products');
export const orderKeys = queryKeysFactory<'orders'>('orders');
export { categoryKeys } from '@p4/api-sdk/react';

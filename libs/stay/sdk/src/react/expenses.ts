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
import { createExpenseApi, type ExpenseListQuery } from '../shared/expenses.js';
import { useStaySdk } from './provider.js';

export const expenseKeys = {
  all: ['stay', 'expenses'] as const,
  list: (query?: ExpenseListQuery) => ['stay', 'expenses', 'list', query ?? {}] as const,
  categories: () => ['stay', 'expenses', 'categories'] as const,
};

export function expenseQueryOptions(sdk: StaySdk) {
  const api = createExpenseApi(sdk);

  return {
    list: (query?: ExpenseListQuery) =>
      queryOptions({
        queryKey: expenseKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        enabled: Boolean(query?.buildingId),
        placeholderData: keepPreviousData,
      }),
    categories: () =>
      queryOptions({
        queryKey: expenseKeys.categories(),
        queryFn: ({ signal }) => api.categories(signal),
      }),
  };
}

export function expenseMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createExpenseApi(sdk);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: expenseKeys.all }),
      client.invalidateQueries({ queryKey: ['stay', 'reports'] }),
    ]);

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    update: () => mutationOptions({ mutationFn: api.update, retry: false, onSuccess: refresh }),
    remove: () => mutationOptions({ mutationFn: api.remove, retry: false, onSuccess: refresh }),
    createCategory: () =>
      mutationOptions({ mutationFn: api.createCategory, retry: false, onSuccess: refresh }),
    updateCategory: () =>
      mutationOptions({ mutationFn: api.updateCategory, retry: false, onSuccess: refresh }),
  };
}

export function useExpenses(query?: ExpenseListQuery) {
  return useQuery(expenseQueryOptions(useStaySdk()).list(query));
}

export function useExpenseCategories() {
  return useQuery(expenseQueryOptions(useStaySdk()).categories());
}

function useExpenseMutations() {
  return expenseMutationOptions(useStaySdk(), useQueryClient());
}

export function useCreateExpense() {
  return useMutation(useExpenseMutations().create());
}
export function useUpdateExpense() {
  return useMutation(useExpenseMutations().update());
}
export function useDeleteExpense() {
  return useMutation(useExpenseMutations().remove());
}
export function useCreateExpenseCategory() {
  return useMutation(useExpenseMutations().createCategory());
}
export function useUpdateExpenseCategory() {
  return useMutation(useExpenseMutations().updateCategory());
}

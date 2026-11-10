import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type ExpenseListQuery = NonNullable<paths['/api/expenses']['get']['parameters']['query']>;
export type ExpenseCreateInput =
  paths['/api/expenses']['post']['requestBody']['content']['application/json'];
export type ExpenseUpdateInput =
  paths['/api/expenses/{id}']['put']['requestBody']['content']['application/json'];
export type ExpenseCategoryInput =
  paths['/api/expense-categories']['post']['requestBody']['content']['application/json'];
export type ExpenseCategoryUpdateInput =
  paths['/api/expense-categories/{id}']['put']['requestBody']['content']['application/json'];

export function createExpenseApi(sdk: StaySdk) {
  return {
    list: async (query?: ExpenseListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/expenses', { params: { query }, signal })),
    create: async (body: ExpenseCreateInput) =>
      unwrap(await sdk.POST('/api/expenses', { body })).data,
    update: async ({ id, body }: { id: string; body: ExpenseUpdateInput }) =>
      unwrap(await sdk.PUT('/api/expenses/{id}', { params: { path: { id } }, body })).data,
    remove: async (id: string) =>
      unwrap(await sdk.DELETE('/api/expenses/{id}', { params: { path: { id } } })).data,
    categories: async (signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/expense-categories', { signal })).data,
    createCategory: async (body: ExpenseCategoryInput) =>
      unwrap(await sdk.POST('/api/expense-categories', { body })).data,
    updateCategory: async ({ id, body }: { id: string; body: ExpenseCategoryUpdateInput }) =>
      unwrap(await sdk.PUT('/api/expense-categories/{id}', { params: { path: { id } }, body }))
        .data,
  };
}

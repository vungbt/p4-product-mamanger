import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type ContractListQuery = NonNullable<paths['/api/contracts']['get']['parameters']['query']>;
export type ContractInput = components['schemas']['ContractInput'];
export type ContractUpdateInput = ContractInput & { version: number };

export function createContractApi(sdk: StaySdk) {
  return {
    list: async (query?: ContractListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contracts', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contracts/{id}', { params: { path: { id } }, signal })).data,
    preview: async (id: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/contracts/{id}/move-in-preview', { params: { path: { id } }, signal }),
      ).data,
    create: async (body: ContractInput, idempotencyKey?: string) =>
      unwrap(
        await sdk.POST('/api/contracts', {
          body,
          params: { header: { 'Idempotency-Key': idempotencyKey } },
        }),
      ).data,
    update: async ({ id, body }: { id: string; body: ContractUpdateInput }) =>
      unwrap(await sdk.PUT('/api/contracts/{id}', { params: { path: { id } }, body })).data,
    activate: async (id: string) =>
      unwrap(await sdk.POST('/api/contracts/{id}/activate', { params: { path: { id } } })).data,
    cancel: async (id: string) =>
      unwrap(await sdk.POST('/api/contracts/{id}/cancel', { params: { path: { id } } })).data,
  };
}

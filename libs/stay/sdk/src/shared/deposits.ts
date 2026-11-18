import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type DepositListQuery = NonNullable<paths['/api/deposits']['get']['parameters']['query']>;
export type DepositCreateInput = components['schemas']['DepositInput'];

export function createDepositApi(sdk: StaySdk) {
  return {
    list: async (query?: DepositListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/deposits', { params: { query }, signal })),
    ledger: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/contracts/{id}/deposits', { params: { path: { id } }, signal }))
        .data,
    create: async ({
      id,
      body,
      idempotencyKey,
    }: {
      id: string;
      body: DepositCreateInput;
      idempotencyKey?: string;
    }) =>
      unwrap(
        await sdk.POST('/api/contracts/{id}/deposits', {
          params: { path: { id }, header: { 'Idempotency-Key': idempotencyKey } },
          body,
        }),
      ).data,
  };
}

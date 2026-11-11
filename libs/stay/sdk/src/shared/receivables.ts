import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type ReceivableListQuery = NonNullable<
  paths['/api/buildings/{buildingId}/receivables']['get']['parameters']['query']
>;

export function createReceivableApi(sdk: StaySdk) {
  return {
    /** ST-18: unpaid invoices of a building grouped by contract, with totals in `meta`. */
    list: async (buildingId: string, query?: ReceivableListQuery, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/receivables', {
          params: { path: { buildingId }, query },
          signal,
        }),
      ),
  };
}

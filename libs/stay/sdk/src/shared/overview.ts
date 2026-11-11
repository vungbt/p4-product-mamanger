import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';

export function createOverviewApi(sdk: StaySdk) {
  return {
    /** ST-19: monthly overview of a building; `period` defaults to the current billing period. */
    get: async (buildingId: string, period?: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/buildings/{buildingId}/overview', {
          params: { path: { buildingId }, query: period ? { period } : {} },
          signal,
        }),
      ).data,
  };
}

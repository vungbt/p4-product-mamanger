import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { paths } from './generated.js';

export type AuditListQuery = NonNullable<paths['/api/audit-logs']['get']['parameters']['query']>;

export function createAuditApi(sdk: StaySdk) {
  return {
    list: async (query?: AuditListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/audit-logs', { params: { query }, signal })),
    detail: async (id: string, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/audit-logs/{id}', { params: { path: { id } }, signal })).data,
  };
}

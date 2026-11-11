import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components } from './generated.js';

export type TenantPortalLinkCreateInput = components['schemas']['TenantPortalLinkInput'];

/** ST-25 staff side: portal links of a contract's occupants (staff session). */
export function createPortalLinkApi(sdk: StaySdk) {
  return {
    list: async (contractId: string, signal?: AbortSignal) =>
      unwrap(
        await sdk.GET('/api/contracts/{id}/portal-links', {
          params: { path: { id: contractId } },
          signal,
        }),
      ).data,
    /** Returns the link token once; a new link for the same occupant revokes the previous one. */
    create: async ({ contractId, tenantId }: { contractId: string; tenantId: string }) =>
      unwrap(
        await sdk.POST('/api/contracts/{id}/portal-links', {
          params: { path: { id: contractId } },
          body: { tenantId },
        }),
      ).data,
    revoke: async (id: string) =>
      unwrap(await sdk.DELETE('/api/portal-links/{id}', { params: { path: { id } } })).data,
  };
}

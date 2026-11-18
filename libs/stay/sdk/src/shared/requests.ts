import type { StaySdk } from './client.js';
import { unwrap } from './errors.js';
import type { components, paths } from './generated.js';

export type InboxListQuery = NonNullable<paths['/api/requests']['get']['parameters']['query']>;
export type InboxAcceptRequest = components['schemas']['InboxAcceptInput'];
export type InboxRejectRequest = components['schemas']['InboxRejectInput'];
export type InboxReplyRequest = components['schemas']['InboxReplyInput'];
export type PaymentClaimConfirmRequest = components['schemas']['PaymentClaimConfirmInput'];

/** ST-25 O-26: the staff inbox of maintenance reports, tenant requests and payment claims. */
export function createRequestInboxApi(sdk: StaySdk) {
  return {
    list: async (query?: InboxListQuery, signal?: AbortSignal) =>
      unwrap(await sdk.GET('/api/requests', { params: { query }, signal })),
    accept: async ({ id, body }: { id: string; body: InboxAcceptRequest }) =>
      unwrap(await sdk.POST('/api/requests/{id}/accept', { params: { path: { id } }, body })).data,
    reject: async ({ id, body }: { id: string; body: InboxRejectRequest }) =>
      unwrap(await sdk.POST('/api/requests/{id}/reject', { params: { path: { id } }, body })).data,
    reply: async ({ id, body }: { id: string; body: InboxReplyRequest }) =>
      unwrap(await sdk.POST('/api/requests/{id}/reply', { params: { path: { id } }, body })).data,
    confirmClaim: async ({ id, body }: { id: string; body: PaymentClaimConfirmRequest }) =>
      unwrap(await sdk.POST('/api/payment-claims/{id}/confirm', { params: { path: { id } }, body }))
        .data,
    rejectClaim: async ({ id, body }: { id: string; body: InboxRejectRequest }) =>
      unwrap(await sdk.POST('/api/payment-claims/{id}/reject', { params: { path: { id } }, body }))
        .data,
  };
}
